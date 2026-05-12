import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { checkOperationAllowed } from "../../../helpers/blockchainLedger";

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

    const result = await db.transaction().execute(async (trx) => {
      // 2. Check Asset Transferability & Lock-up
      const asset = await trx
        .selectFrom("tokenizedAssets")
        .where("id", "=", input.assetId)
        .select(["transferable", "lockUpDays", "createdAt"])
        .executeTakeFirst();

      if (!asset) throw new Error("Asset not found");
      if (!asset.transferable) throw new Error("Asset is not transferable");
      
      const lockUpEnds = new Date(asset.createdAt.getTime() + asset.lockUpDays * 24 * 60 * 60 * 1000);
      if (new Date() < lockUpEnds) {
        throw new Error(`Asset is in lock-up period until ${lockUpEnds.toLocaleDateString()}`);
      }

      // Blockchain: Check emergency controls
      await checkOperationAllowed({ assetId: input.assetId, operationType: 'transfer', trx });

      // 3. Check Holdings
      const holding = await trx
        .selectFrom("tokenHoldings")
        .where("userId", "=", userId)
        .where("tokenizedAssetId", "=", input.assetId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

      if (!holding) throw new Error("You do not own any tokens of this asset");

      // We need to check if they have enough "free" tokens.
      // The schema doesn't have a "frozen" field on tokenHoldings, but we can check active listings.
      const activeListings = await trx
        .selectFrom("secondaryListings")
        .where("sellerId", "=", userId)
        .where("tokenizedAssetId", "=", input.assetId)
        .where("status", "=", "active")
        .select("quantity")
        .execute();

      const alreadyListed = activeListings.reduce((sum, l) => sum + l.quantity, 0);
      const available = holding.quantity - alreadyListed;

      if (available < input.quantity) {
        throw new Error(`Insufficient available tokens. You have ${holding.quantity}, but ${alreadyListed} are already listed.`);
      }

      // 4. Create Listing
      const listing = await trx
        .insertInto("secondaryListings")
        .values({
          tokenizedAssetId: input.assetId,
          sellerId: userId,
          quantity: input.quantity,
          filledQuantity: 0,
          pricePerToken: input.pricePerToken.toString(),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
          // Optional: set expiry
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // 5. Log Compliance
      await trx
        .insertInto("complianceLogs")
        .values({
          action: "create_secondary_listing",
          entityType: "secondary_listing",
          entityId: listing.id,
          userId,
          details: {
            assetId: input.assetId,
            quantity: input.quantity,
            price: input.pricePerToken,
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        })
        .execute();

      return listing;
    });

    const response: OutputType = {
      listing: result,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to create a listing" }),
        { status: 401 }
      );
    }
    console.error("Create listing error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to create listing",
      }),
      { status: 400 }
    );
  }
}