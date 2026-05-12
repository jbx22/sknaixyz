import { schema, OutputType } from "./invest_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { sql } from "kysely";
import { checkOperationAllowed, recordTokenIssuance } from "../../../helpers/blockchainLedger";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // 1. Check KYC
    const kyc = await db
      .selectFrom("kycRecords")
      .where("userId", "=", userId)
      .select("status")
      .executeTakeFirst();

    if (!kyc || kyc.status !== "approved") {
      return new Response(
        superjson.stringify({ error: "KYC verification required and must be approved." }),
        { status: 403 }
      );
    }

    // 2. Check Risk Acknowledgement
    const riskAck = await db
      .selectFrom("investorAcknowledgements")
      .where("userId", "=", userId)
      .where("acknowledgementType", "=", "investment_risk")
      .select("id")
      .executeTakeFirst();

    if (!riskAck) {
      return new Response(
        superjson.stringify({ error: "Investment risk acknowledgement required." }),
        { status: 403 }
      );
    }

    // Transaction for the investment
    const result = await db.transaction().execute(async (trx) => {
      // Blockchain: Check emergency controls
      await checkOperationAllowed({ assetId: input.assetId, operationType: 'issuance', trx });

      // 3. Check Offering Status & Availability (Lock row)
      const offering = await trx
        .selectFrom("tokenizedAssets")
        .where("id", "=", input.assetId)
        .select(["id", "offeringStatus", "totalTokens", "tokensSold", "tokenPrice", "propertyId", "spvId"])
        .forUpdate()
        .executeTakeFirst();

      if (!offering) {
        throw new Error("Offering not found");
      }

      if (offering.offeringStatus !== "open") {
        throw new Error("Offering is not open for investment");
      }

      const available = offering.totalTokens - offering.tokensSold;
      if (available < input.quantity) {
        throw new Error(`Not enough tokens available. Only ${available} left.`);
      }

      const totalCost = Number(offering.tokenPrice) * input.quantity;

      // 4. Check Wallet Balance (Lock row)
      const wallet = await trx
        .selectFrom("investorWallets")
        .where("userId", "=", userId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (Number(wallet.balanceSar) < totalCost) {
        throw new Error("Insufficient wallet balance");
      }

      // 5. Execute Investment
      
      // a. Deduct from wallet
      const updatedWallet = await trx
        .updateTable("investorWallets")
        .where("userId", "=", userId)
        .set({
          balanceSar: sql`balance_sar - ${totalCost}`,
          totalInvested: sql`total_invested + ${totalCost}`,
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // b. Create wallet transaction
      await trx
        .insertInto("walletTransactions")
        .values({
          userId,
          walletId: wallet.id,
          type: "token_purchase",
          status: "completed",
          amount: totalCost.toString(),
          description: `Investment in asset #${input.assetId}`,
          metadata: { assetId: input.assetId, quantity: input.quantity },
          createdAt: new Date(),
        })
        .execute();

      // c. Upsert token holdings
      // We need to handle the upsert carefully to update average price
      const existingHolding = await trx
        .selectFrom("tokenHoldings")
        .where("userId", "=", userId)
        .where("tokenizedAssetId", "=", input.assetId)
        .selectAll()
        .executeTakeFirst();

      let updatedHolding;
      if (existingHolding) {
        const newQuantity = existingHolding.quantity + input.quantity;
        const currentTotalCost = Number(existingHolding.averagePurchasePrice) * existingHolding.quantity;
        const newTotalCost = currentTotalCost + totalCost;
        const newAvgPrice = newTotalCost / newQuantity;

        updatedHolding = await trx
          .updateTable("tokenHoldings")
          .where("id", "=", existingHolding.id)
          .set({
            quantity: newQuantity,
            averagePurchasePrice: newAvgPrice.toString(),
            totalInvested: sql`total_invested + ${totalCost}`,
            updatedAt: new Date(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      } else {
        updatedHolding = await trx
          .insertInto("tokenHoldings")
          .values({
            userId,
            tokenizedAssetId: input.assetId,
            quantity: input.quantity,
            averagePurchasePrice: offering.tokenPrice,
            totalInvested: totalCost.toString(),
            totalIncomeReceived: 0,
            acquiredAt: new Date(),
            updatedAt: new Date(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      // d. Update tokenized_assets
      const newTokensSold = offering.tokensSold + input.quantity;
      const isSoldOut = newTokensSold >= offering.totalTokens;
      
      await trx
        .updateTable("tokenizedAssets")
        .where("id", "=", input.assetId)
        .set({
          tokensSold: newTokensSold,
          offeringStatus: isSoldOut ? "closed" : "open",
          updatedAt: new Date(),
        })
        .execute();

      // e. Create token transfer record
      await trx
        .insertInto("tokenTransfers")
        .values({
          tokenizedAssetId: input.assetId,
          toUserId: userId,
          fromUserId: null, // Primary purchase
          quantity: input.quantity,
          pricePerToken: offering.tokenPrice,
          totalAmount: totalCost.toString(),
          transferType: "primary_purchase",
          createdAt: new Date(),
        })
        .execute();

      // f. Log compliance
      await trx
        .insertInto("complianceLogs")
        .values({
          action: "primary_investment",
          entityType: "tokenized_asset",
          entityId: input.assetId,
          userId,
          details: {
            quantity: input.quantity,
            totalCost,
            tokenPrice: offering.tokenPrice,
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        })
        .execute();

      // Blockchain: Record on ledger
      await recordTokenIssuance({
        assetId: input.assetId,
        spvId: offering.spvId,
        toUserId: userId,
        tokenAmount: input.quantity,
        pricePerToken: Number(offering.tokenPrice),
        executedBy: userId,
        metadata: { quantity: input.quantity, totalCost, transferType: 'primary_purchase' }
      }, trx);

      return { updatedWallet, updatedHolding };
    });

    const response: OutputType = {
      wallet: result.updatedWallet,
      holding: result.updatedHolding,
      message: "Investment successful",
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to invest" }),
        { status: 401 }
      );
    }
    console.error("Investment error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Investment failed",
      }),
      { status: 400 }
    );
  }
}