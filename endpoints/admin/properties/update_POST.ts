import { schema, OutputType } from "./update_POST.schema";
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
      .select(["id", "title", "status", "isFeatured", "price"])
      .where("id", "=", input.propertyId)
      .executeTakeFirst();

    if (!existingProperty) {
      return new Response(superjson.stringify({ error: "Property not found" }), { status: 404 });
    }

    // Perform update
    const updatedProperty = await db
      .updateTable("properties")
      .set({
        status: input.status,
        isFeatured: input.isFeatured,
        price: input.price,
        updatedAt: new Date(),
      })
      .where("id", "=", input.propertyId)
      .returning(["id", "status", "isFeatured", "price"])
      .executeTakeFirstOrThrow();

    // Log activity
    await logAdminActivity({
      adminId: session.user.id,
      actionType: "UPDATE_PROPERTY",
      targetType: "PROPERTY",
      targetId: input.propertyId,
      details: {
        previous: existingProperty,
        updated: input,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(superjson.stringify({ success: true, property: updatedProperty } satisfies OutputType));
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