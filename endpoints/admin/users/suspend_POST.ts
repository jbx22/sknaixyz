import { schema, OutputType } from "./suspend_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { logAdminActivity } from "../../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      return new Response(
        superjson.stringify({ error: "Request payload too large" }),
        { status: 413 }
      );
    }

    const session = await getServerUserSession(request);
    if (session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const json = superjson.parse(body);
    const input = schema.parse(json);

    // Prevent suspending self
    if (input.userId === session.user.id) {
      return new Response(
        superjson.stringify({ error: "Cannot suspend your own account" }),
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await db
      .selectFrom("users")
      .select(["id", "email", "role", "status"])
      .where("id", "=", input.userId)
      .executeTakeFirst();

    if (!targetUser) {
      return new Response(superjson.stringify({ error: "User not found" }), { status: 404 });
    }

    if (targetUser.role === "superadmin") {
      return new Response(
        superjson.stringify({ error: "Cannot suspend superadmin accounts" }),
        { status: 403 }
      );
    }

    if (targetUser.status === "suspended") {
      return new Response(
        superjson.stringify({ error: "User is already suspended" }),
        { status: 400 }
      );
    }

    await db
      .updateTable("users")
      .set({ status: "suspended", updatedAt: new Date() })
      .where("id", "=", input.userId)
      .execute();

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "SUSPEND_USER",
      targetType: "USER",
      targetId: input.userId,
      details: {
        reason: input.reason,
        targetUserEmail: targetUser.email,
        previousStatus: targetUser.status,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(
      superjson.stringify({ success: true } satisfies OutputType)
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
