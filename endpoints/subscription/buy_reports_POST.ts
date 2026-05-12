import { schema, OutputType } from "./buy_reports_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { SubscriptionTier } from "../../helpers/schema";

const COST_PER_REPORT_PREMIUM = 5; // SAR for premium tier
const COST_PER_REPORT_STANDARD = 10; // SAR for free and basic tiers

export async function handle(request: Request) {
  try {
    const body = await request.text();
    
    // 1. Authenticate
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    // 2. Parse Input
    const json = superjson.parse(body);
    const input = schema.parse(json);

    // 3. Calculate Cost based on user's subscription tier
    const isPremium = session.user.subscriptionTier === "premium";
    const costPerReport = isPremium ? COST_PER_REPORT_PREMIUM : COST_PER_REPORT_STANDARD;
    const totalCost = input.quantity * costPerReport;
    const now = new Date();

    // 4. Perform Database Transaction
    await db.transaction().execute(async (trx) => {
      // Record the payment (Simulated)
      // We use the user's current tier for the record, or 'free' if somehow undefined, 
      // though session.user.subscriptionTier should be present.
      const currentTier = (session.user.subscriptionTier as SubscriptionTier) || "free";

      await trx
        .insertInto("subscriptionPayments")
        .values({
          userId,
          tier: currentTier,
          amount: totalCost,
          currency: "SAR",
          paymentMethod: "simulated_credit_card", // Placeholder for now
          transactionId: `report-buy-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          paymentStatus: "completed",
          startedAt: now,
          // For one-off purchases, expiresAt isn't really applicable in the same way, 
          // but the schema requires it. We set it to now as the transaction is "done".
          expiresAt: now, 
          updatedAt: now,
        })
        .execute();

      // Update user's aiReportsUsed with a negative offset
      // This effectively gives them more allowance.
      // e.g. if used=5, limit=5. Buy 5 -> used becomes 0. They can use 5 more before hitting limit=5 again.
      // e.g. if used=5, limit=5. Buy 10 -> used becomes -5. They can use 10 more.
      await trx
        .updateTable("users")
        .set((eb) => ({
          aiReportsUsed: eb("aiReportsUsed", "-", input.quantity),
          updatedAt: now,
        }))
        .where("id", "=", userId)
        .execute();
    });

    return new Response(
      superjson.stringify({
        success: true,
        reportsPurchased: input.quantity,
        totalCost,
        message: `Successfully purchased ${input.quantity} AI reports for ${totalCost} SAR`,
      } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to purchase reports" }),
        { status: 401 }
      );
    }

    console.error("Buy reports error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to purchase reports",
      }),
      { status: 400 }
    );
  }
}