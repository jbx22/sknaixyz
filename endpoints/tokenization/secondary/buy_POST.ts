import { schema, OutputType } from "./buy_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { sql } from "kysely";
import { checkOperationAllowed, recordTokenTransfer } from "../../../helpers/blockchainLedger";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const buyerId = session.user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // 1. Check KYC
    const kyc = await db
      .selectFrom("kycRecords")
      .where("userId", "=", buyerId)
      .select("status")
      .executeTakeFirst();

    if (!kyc || kyc.status !== "approved") {
      return new Response(
        superjson.stringify({ error: "KYC verification required and must be approved." }),
        { status: 403 }
      );
    }

    const result = await db.transaction().execute(async (trx) => {
      // 2. Get Listing & Lock
      const listing = await trx
        .selectFrom("secondaryListings")
        .where("id", "=", input.listingId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

      if (!listing) throw new Error("Listing not found");
      
      // Blockchain: Check emergency controls
      await checkOperationAllowed({ assetId: listing.tokenizedAssetId, operationType: 'transfer', trx });
      if (listing.status !== "active") throw new Error("Listing is not active");
      if (listing.sellerId === buyerId) throw new Error("Cannot buy your own listing");

      const remaining = listing.quantity - listing.filledQuantity;
      if (remaining < input.quantity) {
        throw new Error(`Not enough quantity available. Only ${remaining} left.`);
      }

      const pricePerToken = Number(listing.pricePerToken);
      const totalCost = pricePerToken * input.quantity;

      // 3. Check Buyer Wallet
      const buyerWallet = await trx
        .selectFrom("investorWallets")
        .where("userId", "=", buyerId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

      if (!buyerWallet) throw new Error("Buyer wallet not found");
      if (Number(buyerWallet.balanceSar) < totalCost) throw new Error("Insufficient wallet balance");

      // 4. Execute Trade

      // a. Update Listing
      const newFilled = listing.filledQuantity + input.quantity;
      const isFilled = newFilled >= listing.quantity;
      
      await trx
        .updateTable("secondaryListings")
        .where("id", "=", listing.id)
        .set({
          filledQuantity: newFilled,
          status: isFilled ? "filled" : "active",
          updatedAt: new Date(),
        })
        .execute();

      // b. Transfer Money
      // Deduct buyer
      const updatedBuyerWallet = await trx
        .updateTable("investorWallets")
        .where("userId", "=", buyerId)
        .set({
          balanceSar: sql`balance_sar - ${totalCost}`,
          totalInvested: sql`total_invested + ${totalCost}`,
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Credit seller
      await trx
        .updateTable("investorWallets")
        .where("userId", "=", listing.sellerId)
        .set({
          balanceSar: sql`balance_sar + ${totalCost}`,
          // Note: Seller's totalInvested doesn't change on sale, but maybe totalWithdrawn or just balance?
          // Usually totalInvested tracks money put IN to the platform or assets.
          // Let's just update balance.
          updatedAt: new Date(),
        })
        .execute();

      // c. Transfer Tokens
      // Deduct seller holding
      const sellerHolding = await trx
        .selectFrom("tokenHoldings")
        .where("userId", "=", listing.sellerId)
        .where("tokenizedAssetId", "=", listing.tokenizedAssetId)
        .selectAll()
        .executeTakeFirstOrThrow();

      await trx
        .updateTable("tokenHoldings")
        .where("id", "=", sellerHolding.id)
        .set({
          quantity: sellerHolding.quantity - input.quantity,
          updatedAt: new Date(),
        })
        .execute();

      // Add/Update buyer holding
      const buyerHolding = await trx
        .selectFrom("tokenHoldings")
        .where("userId", "=", buyerId)
        .where("tokenizedAssetId", "=", listing.tokenizedAssetId)
        .selectAll()
        .executeTakeFirst();

      let updatedBuyerHolding;
      if (buyerHolding) {
        const newQuantity = buyerHolding.quantity + input.quantity;
        const currentTotalCost = Number(buyerHolding.averagePurchasePrice) * buyerHolding.quantity;
        const newTotalCost = currentTotalCost + totalCost;
        const newAvgPrice = newTotalCost / newQuantity;

        updatedBuyerHolding = await trx
          .updateTable("tokenHoldings")
          .where("id", "=", buyerHolding.id)
          .set({
            quantity: newQuantity,
            averagePurchasePrice: newAvgPrice.toString(),
            totalInvested: sql`total_invested + ${totalCost}`,
            updatedAt: new Date(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      } else {
        updatedBuyerHolding = await trx
          .insertInto("tokenHoldings")
          .values({
            userId: buyerId,
            tokenizedAssetId: listing.tokenizedAssetId,
            quantity: input.quantity,
            averagePurchasePrice: pricePerToken.toString(),
            totalInvested: totalCost.toString(),
            totalIncomeReceived: 0,
            acquiredAt: new Date(),
            updatedAt: new Date(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      // d. Wallet Transactions
      // Buyer
      await trx
        .insertInto("walletTransactions")
        .values({
          userId: buyerId,
          walletId: buyerWallet.id,
          type: "token_purchase",
          status: "completed",
          amount: totalCost.toString(),
          description: `Secondary purchase from listing #${listing.id}`,
          metadata: { listingId: listing.id, assetId: listing.tokenizedAssetId, quantity: input.quantity },
          createdAt: new Date(),
        })
        .execute();

      // Seller
      // Need seller wallet ID
      const sellerWallet = await trx
        .selectFrom("investorWallets")
        .where("userId", "=", listing.sellerId)
        .select("id")
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("walletTransactions")
        .values({
          userId: listing.sellerId,
          walletId: sellerWallet.id,
          type: "token_sale",
          status: "completed",
          amount: totalCost.toString(),
          description: `Secondary sale via listing #${listing.id}`,
          metadata: { listingId: listing.id, assetId: listing.tokenizedAssetId, quantity: input.quantity },
          createdAt: new Date(),
        })
        .execute();

      // e. Token Transfer Record
      await trx
        .insertInto("tokenTransfers")
        .values({
          tokenizedAssetId: listing.tokenizedAssetId,
          fromUserId: listing.sellerId,
          toUserId: buyerId,
          quantity: input.quantity,
          pricePerToken: pricePerToken.toString(),
          totalAmount: totalCost.toString(),
          transferType: "secondary_buy",
          createdAt: new Date(),
        })
        .execute();

      // f. Compliance Log
      await trx
        .insertInto("complianceLogs")
        .values({
          action: "secondary_trade",
          entityType: "secondary_listing",
          entityId: listing.id,
          userId: buyerId,
          details: {
            sellerId: listing.sellerId,
            quantity: input.quantity,
            price: pricePerToken,
            total: totalCost,
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        })
        .execute();

      // Blockchain: Record transfer on ledger
      await recordTokenTransfer({
        assetId: listing.tokenizedAssetId,
        fromUserId: listing.sellerId,
        toUserId: buyerId,
        tokenAmount: input.quantity,
        pricePerToken: pricePerToken,
        totalAmount: totalCost,
        executedBy: buyerId,
        metadata: { listingId: listing.id, transferType: 'secondary_buy' }
      }, trx);

      return { updatedBuyerWallet, updatedBuyerHolding };
    });

    const response: OutputType = {
      wallet: result.updatedBuyerWallet,
      holding: result.updatedBuyerHolding,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to buy" }),
        { status: 401 }
      );
    }
    console.error("Buy listing error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to buy listing",
      }),
      { status: 400 }
    );
  }
}