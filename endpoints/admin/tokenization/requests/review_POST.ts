import { schema, OutputType } from "./review_POST.schema";
import superjson from "superjson";
import { db } from "../../../../helpers/db";
import { getServerUserSession } from "../../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../../helpers/getSetServerSession";
import { logAdminActivity } from "../../../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      // Update request
      const updatedRequest = await trx
        .updateTable("tokenizationRequests")
        .set({
          status: input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "under_review",
          adminNotes: input.adminNotes || null,
          rejectionReason: input.action === "reject" ? input.rejectionReason : null,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where("id", "=", input.requestId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Log to compliance
      await trx
        .insertInto("complianceLogs")
        .values({
          action: `tokenization_request_${input.action}`,
          entityType: "tokenization_request",
          entityId: input.requestId,
          userId: session.user.id, // Admin ID
          details: JSON.stringify({
            previousStatus: "pending", // Simplified, ideally we fetch first
            newStatus: updatedRequest.status,
            reason: input.rejectionReason,
            notes: input.adminNotes,
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          createdAt: new Date(),
        })
        .execute();

      return updatedRequest;
    });

    // Log admin activity
    await logAdminActivity({
      adminId: session.user.id,
      actionType: `REVIEW_TOKENIZATION_REQUEST_${input.action.toUpperCase()}`,
      targetType: "TOKENIZATION_REQUEST",
      targetId: input.requestId,
      details: {
        action: input.action,
        reason: input.rejectionReason,
        notes: input.adminNotes,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    });

    return new Response(superjson.stringify({ request: result } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}