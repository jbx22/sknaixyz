import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    // Authentication check (optional for viewing offerings? usually yes for investment platforms)
    // The prompt says "All require authentication via getServerUserSession"
    await getServerUserSession(request);

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const rawInput = {
      status: searchParams.status || "open",
      page: searchParams.page ? Number(searchParams.page) : 1,
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 12,
    };

    const input = schema.parse(rawInput);

    let query = db
      .selectFrom("tokenizedAssets")
      .innerJoin("properties", "tokenizedAssets.propertyId", "properties.id")
      .innerJoin("spvs", "tokenizedAssets.spvId", "spvs.id")
      .select([
        "tokenizedAssets.id",
        "tokenizedAssets.propertyId",
        "properties.title as propertyTitle",
        "properties.locationName as propertyLocation",
        "properties.images as propertyImages",
        "properties.propertyType",
        "spvs.name as spvName",
        "spvs.id as spvId",
        "tokenizedAssets.totalValue",
        "tokenizedAssets.tokenPrice",
        "tokenizedAssets.totalTokens",
        "tokenizedAssets.tokensSold",
        "tokenizedAssets.annualRentalYield",
        "tokenizedAssets.incomeRights",
        "tokenizedAssets.votingRights",
        "tokenizedAssets.lockUpDays",
        "tokenizedAssets.transferable",
        "tokenizedAssets.offeringStatus",
        "tokenizedAssets.createdAt",
      ]);

    // Computed column for available tokens
    query = query.select(
      sql<number>`("tokenized_assets"."total_tokens" - "tokenized_assets"."tokens_sold")`.as("availableTokens")
    );

    if (input.status) {
      query = query.where("tokenizedAssets.offeringStatus", "=", input.status);
    }

    // Count total
    const countResult = await db
      .selectFrom("tokenizedAssets")
      .where((eb) => input.status ? eb("offeringStatus", "=", input.status) : eb.val(true))
      .select(db.fn.countAll<string>().as("count"))
      .executeTakeFirst();

    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Pagination
    const offset = (input.page - 1) * input.pageSize;
    query = query
      .orderBy("tokenizedAssets.createdAt", "desc")
      .limit(input.pageSize)
      .offset(offset);

    const offerings = await query.execute();

    const response: OutputType = {
      offerings: offerings as OutputType["offerings"],
      total,
      page: input.page,
      pageSize: input.pageSize,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view offerings" }),
        { status: 401 }
      );
    }
    console.error("Error listing offerings:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to list offerings",
      }),
      { status: 400 }
    );
  }
}