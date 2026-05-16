import { schema, OutputType } from "./assign_POST.schema";
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

    // Check if user exists
    const targetUser = await db
      .selectFrom("users")
      .select(["id", "email", "displayName"])
      .where("id", "=", input.userId)
      .executeTakeFirst();

    if (!targetUser) {
      return new Response(superjson.stringify({ error: "User not found" }), { status: 404 });
    }

    // Check for existing active assignment with same role
    const existing = await db
      .selectFrom("adminRoleAssignments")
      .select(["id"])
      .where("userId", "=", input.userId)
      .where("assignedRole", "=", input.role)
      .where("isActive", "=", true)
      .executeTakeFirst();

    if (existing) {
      return new Response(
        superjson.stringify({ error: "User already has this role assigned" }),
        { status: 400 }
      );
    }

    const result = await db
      .insertInto("adminRoleAssignments")
      .values({
        userId: input.userId,
        assignedRole: input.role,
        assignedBy: session.user.id,
        scope: input.scope,
        isActive: true,
        createdAt: new Date(),
      })
      .returning("id")
      .executeTakeFirst();

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "ASSIGN_ROLE",
      targetType: "USER",
      targetId: input.userId,
      details: {
        assignedRole: input.role,
        scope: input.scope,
        targetUserEmail: targetUser.email,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(
      superjson.stringify({
        success: true,
        assignmentId: result!.id,
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
