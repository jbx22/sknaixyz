import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";
import type { Request } from "express";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    // Get or create user subscription (default: free)
    let subscription = await db
      .selectFrom("userSubscriptions")
      .where("userId", "=", session.user.id)
      .selectAll()
      .executeTakeFirst();

    if (!subscription) {
      // Auto-enroll in free plan
      const result = await db
        .insertInto("userSubscriptions")
        .values({ userId: session.user.id, planTier: "free", status: "active" })
        .returningAll()
        .executeTakeFirst();
      subscription = result!;
    }

    // Get plan features for this tier
    const access = await db
      .selectFrom("planFeatureAccess")
      .innerJoin("planFeatures", "planFeatures.featureKey", "planFeatureAccess.featureKey")
      .where("planFeatureAccess.planTier", "=", subscription.planTier)
      .select(["planFeatureAccess.featureKey", "planFeatureAccess.isIncluded", "planFeatureAccess.usageLimit", "planFeatureAccess.displayValue", "planFeatures.category", "planFeatures.nameEn", "planFeatures.nameAr"])
      .execute();

    return new Response(
      superjson.stringify({ subscription, features: access }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    console.error("[subscriptions/me]", error);
    return new Response(superjson.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
