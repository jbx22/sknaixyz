import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import { superjson } from "../../helpers/schema";
import type { Request } from "express";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");
    if (session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const plans = await db.selectFrom("subscriptionPlans").orderBy("sortOrder", "asc").selectAll().execute();
    const features = await db.selectFrom("planFeatures").orderBy("sortOrder", "asc").selectAll().execute();
    const access = await db.selectFrom("planFeatureAccess").selectAll().execute();
    const services = await db.selectFrom("serviceCatalog").orderBy("id", "asc").selectAll().execute();
    const subscriptions = await db.selectFrom("userSubscriptions")
      .innerJoin("users", "users.id", "userSubscriptions.userId")
      .select(["userSubscriptions.id", "userSubscriptions.userId", "userSubscriptions.planTier", "userSubscriptions.status", "userSubscriptions.currentPeriodStart", "users.email", "users.displayName"])
      .orderBy("userSubscriptions.id", "desc").execute();

    const accessMap: Record<string, Record<string, { id: number; isIncluded: boolean; usageLimit: number | null; displayValue: string | null }>> = {};
    for (const a of access) {
      if (!accessMap[a.planTier]) accessMap[a.planTier] = {};
      accessMap[a.planTier][a.featureKey] = { id: a.id, isIncluded: a.isIncluded, usageLimit: a.usageLimit, displayValue: a.displayValue };
    }

    return new Response(
      superjson.stringify({ plans, features, accessMap, services, subscriptions }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: error.message }), { status: 401, headers: { "Content-Type": "application/json" } });
    console.error("[admin/pricing]", error);
    return new Response(superjson.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
