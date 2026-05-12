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

    // Check if user exists
    const existingUser = await db
      .selectFrom("users")
      .select(["id", "email", "role", "subscriptionTier", "status", "displayName"])
      .where("id", "=", input.userId)
      .executeTakeFirst();

    if (!existingUser) {
      return new Response(superjson.stringify({ error: "User not found" }), { status: 404 });
    }

    // Permission guards
    // 1. Only superadmins can modify other superadmins
    if (existingUser.role === "superadmin" && session.user.role !== "superadmin") {
      return new Response(
        superjson.stringify({ error: "Cannot modify superadmin accounts" }),
        { status: 403 }
      );
    }

    // 2. Only superadmins can assign the superadmin role
    if (input.role === "superadmin" && session.user.role !== "superadmin") {
      return new Response(
        superjson.stringify({ error: "Only superadmins can assign superadmin role" }),
        { status: 403 }
      );
    }

    // Perform update
    const updatedUser = await db
      .updateTable("users")
      .set({
        role: input.role,
        subscriptionTier: input.subscriptionTier,
        status: input.status,
        displayName: input.displayName,
        email: input.email,
        updatedAt: new Date(),
      })
      .where("id", "=", input.userId)
      .returning(["id", "email", "displayName", "role", "subscriptionTier", "status"])
      .executeTakeFirstOrThrow();

    // Log activity
    await logAdminActivity({
      adminId: session.user.id,
      actionType: "UPDATE_USER",
      targetType: "USER",
      targetId: input.userId,
      details: {
        previous: existingUser,
        updated: input,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(superjson.stringify({ success: true, user: updatedUser } satisfies OutputType));
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