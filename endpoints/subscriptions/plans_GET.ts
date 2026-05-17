import { db } from "../../helpers/db";
import { superjson } from "../../helpers/schema";
import type { Request } from "express";

export async function handle(request: Request) {
  try {
    // Public: all active plans with features
    const plans = await db
      .selectFrom("subscriptionPlans")
      .where("isActive", "=", true)
      .orderBy("sortOrder", "asc")
      .selectAll()
      .execute();

    const features = await db
      .selectFrom("planFeatures")
      .where("isPublic", "=", true)
      .orderBy("sortOrder", "asc")
      .selectAll()
      .execute();

    const access = await db
      .selectFrom("planFeatureAccess")
      .innerJoin("planFeatures", "planFeatures.featureKey", "planFeatureAccess.featureKey")
      .where("planFeatures.isPublic", "=", true)
      .select(["planFeatureAccess.planTier", "planFeatureAccess.featureKey", "planFeatureAccess.isIncluded", "planFeatureAccess.usageLimit", "planFeatureAccess.displayValue"])
      .execute();

    // Group access by plan tier
    const accessMap: Record<string, Record<string, { isIncluded: boolean; usageLimit: number | null; displayValue: string | null }>> = {};
    for (const a of access) {
      if (!accessMap[a.planTier]) accessMap[a.planTier] = {};
      accessMap[a.planTier][a.featureKey] = {
        isIncluded: a.isIncluded,
        usageLimit: a.usageLimit,
        displayValue: a.displayValue,
      };
    }

    return new Response(
      superjson.stringify({ plans, features, accessMap }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[plans/list]", error);
    return new Response(superjson.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
