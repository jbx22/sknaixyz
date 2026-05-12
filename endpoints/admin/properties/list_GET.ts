import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

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
      limit: searchParams.limit ? Number(searchParams.limit) : 20,
      search: searchParams.search || undefined,
      userId: searchParams.userId ? Number(searchParams.userId) : undefined,
      status: searchParams.status || undefined,
      propertyType: searchParams.propertyType || undefined,
      isFeatured: searchParams.isFeatured === "true" ? true : searchParams.isFeatured === "false" ? false : undefined,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.limit;

    // Create a function that builds the base query with filters fresh each time
    const buildFilteredQuery = () => {
      let q = db
        .selectFrom("properties")
        .innerJoin("users", "properties.userId", "users.id");

      if (input.search) {
        const searchTerm = `%${input.search.toLowerCase()}%`;
        q = q.where((eb) =>
          eb.or([
            eb("properties.title", "ilike", searchTerm),
            eb("properties.locationName", "ilike", searchTerm),
            eb("users.displayName", "ilike", searchTerm),
          ])
        );
      }

      if (input.userId) {
        q = q.where("properties.userId", "=", input.userId);
      }

      if (input.status) {
        q = q.where("properties.status", "=", input.status);
      }

      if (input.propertyType) {
        q = q.where("properties.propertyType", "=", input.propertyType);
      }

      if (input.isFeatured !== undefined) {
        q = q.where("properties.isFeatured", "=", input.isFeatured);
      }

      return q;
    };

    // Get total count - call function to get fresh query builder
    const countResult = await buildFilteredQuery()
      .select((eb) => eb.fn.count("properties.id").as("count"))
      .executeTakeFirst();
    
    const total = Number(countResult?.count ?? 0);

    // Get paginated results with extra stats - call function again to get another fresh query builder
    const properties = await buildFilteredQuery()
      .select([
        "properties.id",
        "properties.title",
        "properties.price",
        "properties.locationName",
        "properties.status",
        "properties.propertyType",
        "properties.isFeatured",
        "properties.createdAt",
        "properties.userId",
        "users.displayName as ownerName",
        "users.email as ownerEmail",
      ])
      .select((eb) => [
        eb.selectFrom("userFavorites")
          .whereRef("userFavorites.propertyId", "=", "properties.id")
          .select(eb.fn.count("id").as("count"))
          .as("favoritesCount"),
        eb.selectFrom("propertyChats")
          .whereRef("propertyChats.propertyId", "=", "properties.id")
          .select(eb.fn.count("id").as("count"))
          .as("chatsCount"),
      ])
      .orderBy("properties.createdAt", "desc")
      .limit(input.limit)
      .offset(offset)
      .execute();

    // Map results to ensure numbers are numbers
    const mappedProperties = properties.map(p => ({
      ...p,
      favoritesCount: Number(p.favoritesCount || 0),
      chatsCount: Number(p.chatsCount || 0),
    }));

    return new Response(
      superjson.stringify({
        properties: mappedProperties,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
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