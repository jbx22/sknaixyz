import { schema, OutputType } from "./details_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const rawInput = {
      id: searchParams.id ? Number(searchParams.id) : undefined,
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

    let query = db
      .selectFrom("properties")
      .innerJoin("users", "properties.userId", "users.id")
      .select([
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
        "properties.images",
        "properties.createdAt",
        "properties.updatedAt",
        "properties.userId",
        "properties.city",
        "properties.district",
        "users.displayName as ownerName",
        "users.avatarUrl as ownerAvatarUrl",
        "users.email as ownerEmail", // Include email for contact in details view
      ])
      .where("properties.id", "=", input.id);

        // Add isFavorited field based on user session
    if (currentUserId) {
      query = query.select((eb) =>
        eb
          .case()
          .when(
            eb.exists(
              eb
                .selectFrom("userFavorites")
                .whereRef("userFavorites.propertyId", "=", "properties.id")
                .where("userFavorites.userId", "=", currentUserId)
            )
          )
          .then(true)
          .else(false)
          .end()
          .as("isFavorited")
      );
    } else {
      query = query.select(sql<boolean>`false`.as("isFavorited"));
    }

        const result = await query.executeTakeFirst();

    if (!result) {
      return new Response(
        superjson.stringify({ error: "Property not found" }),
        { status: 404 }
      );
    }

    return new Response(superjson.stringify({ property: result as OutputType["property"] }));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}