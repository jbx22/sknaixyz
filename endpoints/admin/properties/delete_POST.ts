import { schema, OutputType } from "./delete_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { logAdminActivity } from "../../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      // 1MB limit
      return new Response(
        superjson.stringify({ error: "Request payload too large" }),
        { status: 413 }
      );
    }

    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const json = superjson.parse(body);
    const input = schema.parse(json);

    // Check if property exists
    const existingProperty = await db
      .selectFrom("properties")
      .select(["title"])
      .where("id", "=", input.propertyId)
      .executeTakeFirst();

    if (!existingProperty) {
      return new Response(superjson.stringify({ error: "Property not found" }), { status: 404 });
    }

    // Perform cascade delete in a transaction
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("userFavorites").where("propertyId", "=", input.propertyId).execute();
      await trx.deleteFrom("propertyChats").where("propertyId", "=", input.propertyId).execute();
      await trx.deleteFrom("properties").where("id", "=", input.propertyId).execute();
    });

    // Log activity
    await logAdminActivity({
      adminId: session.user.id,
      actionType: "DELETE_PROPERTY",
      targetType: "PROPERTY",
      targetId: input.propertyId,
      details: {
        deletedPropertyTitle: existingProperty.title,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
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