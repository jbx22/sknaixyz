import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";
import type { Request } from "express";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    const url = new URL(request.url, "http://x");
    const featureKey = url.searchParams.get("feature");
    if (!featureKey) {
      return new Response(superjson.stringify({ error: "feature param required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Get user's plan
    let subscription = await db
      .selectFrom("userSubscriptions")
      .where("userId", "=", session.user.id)
      .select("planTier")
      .executeTakeFirst();

    const planTier = subscription?.planTier || "free";

    // Check feature access
    const access = await db
      .selectFrom("planFeatureAccess")
      .where("planTier", "=", planTier)
      .where("featureKey", "=", featureKey)
      .select(["isIncluded", "usageLimit", "displayValue"])
      .executeTakeFirst();

    return new Response(
      superjson.stringify({
        allowed: access?.isIncluded ?? false,
        planTier,
        featureKey,
        usageLimit: access?.usageLimit ?? null,
        displayValue: access?.displayValue ?? null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    console.error("[subscriptions/check-feature]", error);
    return new Response(superjson.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
