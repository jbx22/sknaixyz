import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { superjson } from "../../../helpers/schema";
import { db } from "../../../helpers/db";
import type { Request } from "express";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return new Response(superjson.stringify({ error: "userId is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    await db.updateTable("users")
      .set({ status: "active", updatedAt: new Date() })
      .where("id", "=", Number(userId))
      .execute();

    await db.insertInto("adminActivityLogs")
      .values({
        adminId: session.user.id,
        actionType: "user_activated",
        targetType: "user",
        targetId: Number(userId),
        details: { activatedBy: session.user.id },
      })
      .execute();

    return new Response(
      superjson.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    console.error("[admin/users/activate]", error);
    return new Response(superjson.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
