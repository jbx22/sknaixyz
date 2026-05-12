import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from '../../../../helpers/db';
import { getServerUserSession } from '../../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../../helpers/getSetServerSession';
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : 1,
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 20,
      status: searchParams.status || undefined
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.pageSize;

    let query = db.
    selectFrom("tokenizedAssets").
    innerJoin("properties", "tokenizedAssets.propertyId", "properties.id").
    innerJoin("spvs", "tokenizedAssets.spvId", "spvs.id").
    select([
    "tokenizedAssets.id",
    "tokenizedAssets.propertyId",
    "properties.title as propertyTitle",
    "properties.locationName as propertyLocation",
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
    "tokenizedAssets.titleDeedUrl",
    "tokenizedAssets.valuationReportUrl",
    "tokenizedAssets.createdAt",
    "tokenizedAssets.updatedAt"]
    );

    // Computed columns
    query = query.select([
    sql<number>`("tokenized_assets"."total_tokens" - "tokenized_assets"."tokens_sold")`.as("availableTokens"),
    sql<number>`(CAST("tokenized_assets"."tokens_sold" AS FLOAT) / NULLIF("tokenized_assets"."total_tokens", 0) * 100)`.as("percentSold")]
    );

    if (input.status) {
      query = query.where("tokenizedAssets.offeringStatus", "=", input.status);
    }

    const countResult = await query.
    clearSelect().
    select((eb) => eb.fn.count("tokenizedAssets.id").as("count")).
    executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const offerings = await query.
    orderBy("tokenizedAssets.createdAt", "desc").
    limit(input.pageSize).
    offset(offset).
    execute();

    return new Response(
      superjson.stringify({
        offerings: offerings as OutputType["offerings"],
        total,
        page: input.page,
        pageSize: input.pageSize
      } satisfies OutputType)
    );
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