import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { db } from '../../../../helpers/db';
import { getServerUserSession } from '../../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../../helpers/getSetServerSession';
import { logAdminActivity } from '../../../../helpers/logAdminActivity';

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await request.text();
    const json = superjson.parse(body);
    const input = schema.parse(json);

    const existingRecord = await db.
    selectFrom("kycRecords").
    selectAll().
    where("id", "=", input.kycId).
    executeTakeFirst();

    if (!existingRecord) {
      return new Response(superjson.stringify({ error: "KYC record not found" }), { status: 404 });
    }

    let updateData: any = {
      updatedAt: new Date()
    };

    if (input.action === "approve") {
      updateData.status = "approved";
      updateData.verifiedAt = new Date();
      updateData.rejectionReason = null;
      if (input.suitability) {
        updateData.suitability = input.suitability;
      }
    } else {
      updateData.status = "rejected";
      updateData.rejectionReason = input.rejectionReason;
      // We don't clear verifiedAt if it was previously verified, or maybe we should? 
      // Usually rejection means current state is invalid.
      // But let's keep it simple based on requirements.
    }

    const updatedRecord = await db.
    updateTable("kycRecords").
    set(updateData).
    where("id", "=", input.kycId).
    returningAll().
    executeTakeFirstOrThrow();

    await logAdminActivity({
      adminId: session.user.id,
      actionType: input.action === "approve" ? "APPROVE_KYC" : "REJECT_KYC",
      targetType: "KYC_RECORD",
      targetId: input.kycId,
      details: {
        previousStatus: existingRecord.status,
        newStatus: updatedRecord.status,
        reason: input.rejectionReason,
        suitability: input.suitability
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    });

    return new Response(superjson.stringify({ record: updatedRecord } satisfies OutputType));
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