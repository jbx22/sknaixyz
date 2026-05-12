import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { logAdminActivity } from "../../../helpers/logAdminActivity";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Transaction to update user tier and create/update payment record
    await db.transaction().execute(async (trx) => {
      // 1. Update user tier
      await trx
        .updateTable("users")
        .set({ subscriptionTier: input.tier })
        .where("id", "=", input.userId)
        .execute();

      // 2. Create a new subscription payment record to reflect this manual change
      // We treat this as a "manual" payment/grant
      await trx
        .insertInto("subscriptionPayments")
        .values({
          userId: input.userId,
          tier: input.tier,
          amount: "0", // Manual grant usually 0 or we could ask for amount
          currency: "SAR",
          paymentStatus: "completed",
          paymentMethod: "admin_manual",
          startedAt: new Date(),
          expiresAt: input.expiresAt,
        })
        .execute();
    });

    // Log activity
    await logAdminActivity({
      adminId: session.user.id,
      actionType: "UPDATE_SUBSCRIPTION",
      targetType: "USER",
      targetId: input.userId,
      details: {
        newTier: input.tier,
        expiresAt: input.expiresAt,
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