import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { db } from '../../../../helpers/db';
import { getServerUserSession } from '../../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../../helpers/getSetServerSession';
import { logAdminActivity } from '../../../../helpers/logAdminActivity';
import { appendToLedger } from "../../../../helpers/blockchainLedger";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await request.text();
    const json = superjson.parse(body);
    const input = schema.parse(json);

    // Check if property exists
    const property = await db.
    selectFrom("properties").
    select("id").
    where("id", "=", input.propertyId).
    executeTakeFirst();

    if (!property) {
      return new Response(superjson.stringify({ error: "Property not found" }), { status: 404 });
    }

    // Check if already tokenized
    const existingTokenization = await db.
    selectFrom("tokenizedAssets").
    select("id").
    where("propertyId", "=", input.propertyId).
    executeTakeFirst();

    if (existingTokenization) {
      return new Response(superjson.stringify({ error: "Property is already tokenized" }), { status: 400 });
    }

    // Transaction to create SPV and Tokenized Asset
    const result = await db.transaction().execute(async (trx) => {
      // Create SPV
      const spv = await trx.
      insertInto("spvs").
      values({
        name: input.spvName,
        legalStructure: input.spvLegalStructure || "LLC",
        registrationNumber: input.spvRegistrationNumber,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      }).
      returningAll().
      executeTakeFirstOrThrow();

      // Create Tokenized Asset
      const offering = await trx.
      insertInto("tokenizedAssets").
      values({
        propertyId: input.propertyId,
        spvId: spv.id,
        totalValue: input.totalValue.toString(),
        tokenPrice: input.tokenPrice.toString(),
        totalTokens: input.totalTokens,
        tokensSold: 0,
        annualRentalYield: input.annualRentalYield?.toString() || null,
        incomeRights: input.incomeRights ?? true,
        votingRights: input.votingRights ?? false,
        lockUpDays: input.lockUpDays ?? 180,
        transferable: input.transferable ?? true,
        offeringStatus: "draft",
        createdAt: new Date(),
        updatedAt: new Date()
      }).
      returningAll().
      executeTakeFirstOrThrow();

      // Blockchain: Record asset tokenization on ledger
      await appendToLedger({
        entryType: 'asset_tokenization',
        assetId: offering.id,
        spvId: spv.id,
        executedBy: session.user.id,
        tokenAmount: input.totalTokens,
        sarAmount: input.totalValue,
        pricePerToken: input.tokenPrice,
        complianceChecks: { adminCreated: true },
        metadata: { propertyId: input.propertyId, spvName: input.spvName },
        status: 'confirmed',
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      }, trx);

      return { spv, offering };
    });

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "CREATE_OFFERING",
      targetType: "TOKENIZED_ASSET",
      targetId: result.offering.id,
      details: {
        propertyId: input.propertyId,
        spvId: result.spv.id,
        totalValue: input.totalValue
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    });

    return new Response(superjson.stringify(result satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}