import { schema, OutputType } from "./upgrade_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { SubscriptionTier } from "../../helpers/schema";

// Pricing constants (in SAR) - all monthly subscriptions
const PRICING: Record<Exclude<SubscriptionTier, "free">, number> = {
  basic: 99,
  premium: 299,
};

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

    // 1. Authenticate
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    // 2. Parse Input
    const json = superjson.parse(body);
    const input = schema.parse(json);

    // 3. Calculate Expiration and Amount
    const now = new Date();
    let expiresAt = new Date(now);
    let amount = 0;

    if (input.tier === "basic") {
      // Basic: 1 month
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      amount = PRICING.basic;
    } else if (input.tier === "premium") {
      // Premium: 1 month
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      amount = PRICING.premium;
    }

    // 4. Perform Database Transaction
    // We need to record the payment and update the user's tier atomically
    await db.transaction().execute(async (trx) => {
      // Create subscription payment record
      await trx
        .insertInto("subscriptionPayments")
        .values({
          userId,
          tier: input.tier,
          amount,
          currency: "SAR",
          paymentMethod: input.paymentMethod,
          transactionId: input.transactionId ?? `manual-${Date.now()}`,
          paymentStatus: "completed",
          startedAt: now,
          expiresAt: expiresAt,
          updatedAt: now,
        })
        .execute();

      // Update user tier and reset AI report quota (give fresh monthly quota)
      await trx
        .updateTable("users")
        .set({
          subscriptionTier: input.tier,
          aiReportsUsed: 0,
          aiReportsResetAt: now,
          updatedAt: now,
        })
        .where("id", "=", userId)
        .execute();
    });

    return new Response(
      superjson.stringify({
        success: true,
        tier: input.tier,
        expiresAt,
        message: `Successfully upgraded to ${input.tier} tier`,
      } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to upgrade subscription" }),
        { status: 401 }
      );
    }

    console.error("Subscription upgrade error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to upgrade subscription",
      }),
      { status: 400 }
    );
  }
}