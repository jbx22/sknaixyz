import { schema, OutputType } from "./revoke_POST.schema";
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

    // Check assignment exists and is active
    const assignment = await db
      .selectFrom("adminRoleAssignments")
      .select(["id", "userId", "assignedRole", "isActive"])
      .where("id", "=", input.assignmentId)
      .executeTakeFirst();

    if (!assignment) {
      return new Response(
        superjson.stringify({ error: "Assignment not found" }),
        { status: 404 }
      );
    }

    if (!assignment.isActive) {
      return new Response(
        superjson.stringify({ error: "Assignment is already revoked" }),
        { status: 400 }
      );
    }

    await db
      .updateTable("adminRoleAssignments")
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedBy: session.user.id,
      })
      .where("id", "=", input.assignmentId)
      .execute();

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "REVOKE_ROLE",
      targetType: "USER",
      targetId: assignment.userId,
      details: {
        assignmentId: input.assignmentId,
        revokedRole: assignment.assignedRole,
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
