import { schema, OutputType } from "./toggle_favorite_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Check if property exists
    const property = await db
      .selectFrom("properties")
      .select("id")
      .where("id", "=", input.propertyId)
      .executeTakeFirst();

    if (!property) {
      return new Response(
        superjson.stringify({ error: "Property not found" }),
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await db
      .selectFrom("userFavorites")
      .select("id")
      .where("userId", "=", userId)
      .where("propertyId", "=", input.propertyId)
      .executeTakeFirst();

    let isFavorited = false;

    if (existingFavorite) {
      // Remove favorite
      await db
        .deleteFrom("userFavorites")
        .where("id", "=", existingFavorite.id)
        .execute();
      isFavorited = false;
    } else {
      // Add favorite
      await db
        .insertInto("userFavorites")
        .values({
          userId,
          propertyId: input.propertyId,
        })
        .execute();
      isFavorited = true;
    }

    return new Response(
      superjson.stringify({ success: true, isFavorited } satisfies OutputType)
    );
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}