import { schema, OutputType } from "./listings_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    await getServerUserSession(request);

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const rawInput = {
      assetId: searchParams.assetId ? Number(searchParams.assetId) : undefined,
      page: searchParams.page ? Number(searchParams.page) : 1,
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 20,
    };

    const input = schema.parse(rawInput);

    let query = db
      .selectFrom("secondaryListings")
      .innerJoin("tokenizedAssets", "secondaryListings.tokenizedAssetId", "tokenizedAssets.id")
      .innerJoin("properties", "tokenizedAssets.propertyId", "properties.id")
      .innerJoin("users", "secondaryListings.sellerId", "users.id")
      .where("secondaryListings.status", "=", "active")
      .select([
        "secondaryListings.id",
        "secondaryListings.tokenizedAssetId",
        "properties.title as propertyTitle",
        "users.displayName as sellerName",
        "secondaryListings.quantity",
        "secondaryListings.filledQuantity",
        "secondaryListings.pricePerToken",
        "secondaryListings.status",
        "secondaryListings.expiresAt",
        "secondaryListings.createdAt",
      ]);

    // Computed remaining quantity
    query = query.select(
      sql<number>`("secondary_listings"."quantity" - "secondary_listings"."filled_quantity")`.as("remainingQuantity")
    );

    if (input.assetId) {
      query = query.where("secondaryListings.tokenizedAssetId", "=", input.assetId);
    }

    // Count total
    let countQuery = db
      .selectFrom("secondaryListings")
      .where("status", "=", "active");
      
    if (input.assetId) {
      countQuery = countQuery.where("tokenizedAssetId", "=", input.assetId);
    }

    const countResult = await countQuery
      .select(db.fn.countAll<string>().as("count"))
      .executeTakeFirst();

    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Pagination
    const offset = (input.page - 1) * input.pageSize;
    query = query
      .orderBy("secondaryListings.createdAt", "desc")
      .limit(input.pageSize)
      .offset(offset);

    const listings = await query.execute();

    const response: OutputType = {
      listings: listings as OutputType["listings"],
      total,
      page: input.page,
      pageSize: input.pageSize,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view secondary market" }),
        { status: 401 }
      );
    }
    console.error("Secondary listings error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch listings",
      }),
      { status: 400 }
    );
  }
}