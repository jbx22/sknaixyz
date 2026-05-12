import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse query params using schema
    const rawInput = {
      search: searchParams.search || undefined,
      propertyType: searchParams.propertyType || undefined,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      minBedrooms: searchParams.minBedrooms ? Number(searchParams.minBedrooms) : undefined,
      userId: searchParams.userId ? Number(searchParams.userId) : undefined,
      favoritesOnly: searchParams.favoritesOnly === "true",
      zipCode: searchParams.zipCode || undefined,
      page: searchParams.page ? Number(searchParams.page) : undefined,
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : undefined,
    };

    const input = schema.parse(rawInput);

    // Get current user session (optional)
    let currentUserId: number | null = null;
    try {
      const session = await getServerUserSession(request);
      currentUserId = session.user.id;
    } catch (e) {
      // Ignore if not authenticated
    }

    // If favoritesOnly is true, user must be logged in
    if (input.favoritesOnly && !currentUserId) {
      throw new NotAuthenticatedError();
    }

    // Build base query
    let query = db
      .selectFrom("properties")
      .innerJoin("users", "properties.userId", "users.id");

    query = query.select([
      "properties.id",
      "properties.title",
      "properties.description",
      "properties.price",
      "properties.locationName",
      "properties.latitude",
      "properties.longitude",
      "properties.bedrooms",
      "properties.bathrooms",
      "properties.areaSqm",
      "properties.propertyType",
      "properties.status",
      "properties.zipCode",
      "properties.images",
      "properties.createdAt",
      "properties.updatedAt",
      "properties.userId",
      "properties.aiReportStatus",
      "properties.aiReportGeneratedAt",
      "users.displayName as ownerName",
      "users.avatarUrl as ownerAvatarUrl",
    ]);

    // Add isFavorited field using EXISTS subquery
    if (currentUserId) {
      query = query.select(
        sql<boolean>`EXISTS (
          SELECT 1 FROM user_favorites 
          WHERE user_favorites.property_id = properties.id 
          AND user_favorites.user_id = ${currentUserId}
        )`.as("isFavorited")
      );
    } else {
      query = query.select(sql<boolean>`false`.as("isFavorited"));
    }

    // Apply filters
    if (input.search) {
      const searchTerm = `%${input.search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("properties.title", "ilike", searchTerm),
          eb("properties.description", "ilike", searchTerm),
          eb("properties.locationName", "ilike", searchTerm),
          eb("properties.zipCode", "ilike", searchTerm),
        ])
      );
    }

    if (input.propertyType) {
      query = query.where("properties.propertyType", "=", input.propertyType);
    }

    if (input.minPrice !== undefined) {
      query = query.where("properties.price", ">=", sql`cast(${input.minPrice} as numeric)`);
    }

    if (input.maxPrice !== undefined) {
      query = query.where("properties.price", "<=", sql`cast(${input.maxPrice} as numeric)`);
    }

    if (input.minBedrooms !== undefined) {
      query = query.where("properties.bedrooms", ">=", input.minBedrooms);
    }

    if (input.userId !== undefined) {
      query = query.where("properties.userId", "=", input.userId);
    }

    if (input.zipCode) {
      query = query.where("properties.zipCode", "ilike", `%${input.zipCode}%`);
    }

    if (input.favoritesOnly && currentUserId) {
      query = query.where(({ exists, selectFrom }) =>
        exists(
          selectFrom("userFavorites")
            .whereRef("userFavorites.propertyId", "=", "properties.id")
            .where("userFavorites.userId", "=", currentUserId!)
        )
      );
    }

    // Calculate total count with same filters (before pagination)
    // Need to build a count query with same WHERE conditions
    let countQuery = db
      .selectFrom("properties")
      .innerJoin("users", "properties.userId", "users.id");

    // Apply same filters for count
    if (input.search) {
      const searchTerm = `%${input.search.toLowerCase()}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("properties.title", "ilike", searchTerm),
          eb("properties.description", "ilike", searchTerm),
          eb("properties.locationName", "ilike", searchTerm),
          eb("properties.zipCode", "ilike", searchTerm),
        ])
      );
    }

    if (input.propertyType) {
      countQuery = countQuery.where("properties.propertyType", "=", input.propertyType);
    }

    if (input.minPrice !== undefined) {
      countQuery = countQuery.where("properties.price", ">=", sql`cast(${input.minPrice} as numeric)`);
    }

    if (input.maxPrice !== undefined) {
      countQuery = countQuery.where("properties.price", "<=", sql`cast(${input.maxPrice} as numeric)`);
    }

    if (input.minBedrooms !== undefined) {
      countQuery = countQuery.where("properties.bedrooms", ">=", input.minBedrooms);
    }

    if (input.userId !== undefined) {
      countQuery = countQuery.where("properties.userId", "=", input.userId);
    }

    if (input.zipCode) {
      countQuery = countQuery.where("properties.zipCode", "ilike", `%${input.zipCode}%`);
    }

    if (input.favoritesOnly && currentUserId) {
      countQuery = countQuery.where(({ exists, selectFrom }) =>
        exists(
          selectFrom("userFavorites")
            .whereRef("userFavorites.propertyId", "=", "properties.id")
            .where("userFavorites.userId", "=", currentUserId!)
        )
      );
    }

    const countResult = await countQuery
      .select(db.fn.countAll<string>().as("count"))
      .executeTakeFirst();
    
    const totalCount = countResult ? parseInt(countResult.count, 10) : 0;

    // Sort by created_at DESC
    query = query.orderBy("properties.createdAt", "desc");

    // Apply pagination
    const offset = (input.page - 1) * input.pageSize;
    query = query.limit(input.pageSize).offset(offset);

    const results = await query.execute();

    const output: OutputType = {
      properties: results as OutputType["properties"],
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalCount,
      },
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Error in properties/list_GET:", error);
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}