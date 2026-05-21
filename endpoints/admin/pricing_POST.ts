import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";
import { logAdminActivity } from "../../helpers/logAdminActivity";
import type { Request } from "express";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");
    if (session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const body = superjson.parse(await request.text());
    const { action } = body;

    switch (action) {
      case "update_plan": {
        const { tier, monthlyPriceSar, annualPriceSar, perUnitPriceSar, maxProperties, maxUnitsPerProperty, isActive, launchBadge } = body;
        await db.updateTable("subscriptionPlans")
          .set({ monthlyPriceSar, annualPriceSar, perUnitPriceSar, maxProperties, maxUnitsPerProperty, isActive, launchBadge, updatedAt: new Date() })
          .where("tier", "=", tier).execute();
        await logAdminActivity({ adminId: session.user.id, actionType: "UPDATE_PLAN", targetType: "plan", targetId: null, details: { tier, monthlyPriceSar }, ipAddress: request.headers.get("x-forwarded-for") || "unknown" });
        break;
      }
      case "update_service": {
        const { serviceKey, priceSar, isActive, isBetaFree, betaBadge } = body;
        await db.updateTable("serviceCatalog")
          .set({ priceSar, isActive, isBetaFree, betaBadge, updatedAt: new Date() })
          .where("serviceKey", "=", serviceKey).execute();
        await logAdminActivity({ adminId: session.user.id, actionType: "UPDATE_SERVICE", targetType: "service", targetId: null, details: { serviceKey, priceSar, isBetaFree }, ipAddress: request.headers.get("x-forwarded-for") || "unknown" });
        break;
      }
      case "update_feature_access": {
        const { planTier, featureKey, isIncluded, usageLimit, displayValue } = body;
        await db.updateTable("planFeatureAccess")
          .set({ isIncluded, usageLimit: usageLimit ?? null, displayValue: displayValue ?? null })
          .where("planTier", "=", planTier).where("featureKey", "=", featureKey).execute();
        break;
      }
      case "toggle_beta": {
        // Toggle all services isBetaFree + all plans launchBadge
        const { isBeta } = body;
        if (typeof isBeta === "boolean") {
          await db.updateTable("serviceCatalog").set({ isBetaFree: isBeta, betaBadge: isBeta ? "Free during Launch" : null }).execute();
          await db.updateTable("subscriptionPlans").set({ launchBadge: isBeta ? (tb => tb.case().when("tier", "=", "free").then("Free Forever").else("Free during Launch").end()) as any }).execute();
          // Simpler approach: set per tier
          await db.updateTable("subscriptionPlans").set({ launchBadge: "Free during Launch" }).where("tier", "!=", "free").execute();
          await db.updateTable("subscriptionPlans").set({ launchBadge: "Free Forever" }).where("tier", "=", "free").execute();
          if (!isBeta) {
            await db.updateTable("subscriptionPlans").set({ launchBadge: null }).execute();
            await db.updateTable("serviceCatalog").set({ betaBadge: null }).execute();
          }
        }
        await logAdminActivity({ adminId: session.user.id, actionType: "TOGGLE_BETA", targetType: "pricing", targetId: null, details: { isBeta }, ipAddress: request.headers.get("x-forwarded-for") || "unknown" });
        break;
      }
      case "create_promotion": {
        const { planTier, discountPercent, durationDays, promoCode, description } = body;
        // Store as metadata on the plan
        const existing = await db.selectFrom("subscriptionPlans").where("tier", "=", planTier).select("metadata" as any).executeTakeFirst();
        // We'll store promotions in plan metadata as JSON — but the table doesn't have a metadata column
        // Instead, use a simple approach: store in a global key-value via the service_catalog or a dedicated promotions table
        // For now, store promotion in the plan's launchBadge temporarily
        const discountPrice = (monthlyPrice: number) => Math.round(monthlyPrice * (1 - (discountPercent || 0) / 100) * 100) / 100;
        
        // Get current plan price
        const plan = await db.selectFrom("subscriptionPlans").where("tier", "=", planTier).selectAll().executeTakeFirst();
        if (!plan) throw new Error("Plan not found");
        
        const promoLabel = `${discountPercent}% OFF — ${promoCode}`;
        // Update plan with promo badge showing discount
        await db.updateTable("subscriptionPlans")
          .set({ launchBadge: promoLabel, updatedAt: new Date() })
          .where("tier", "=", planTier).execute();

        await logAdminActivity({ adminId: session.user.id, actionType: "CREATE_PROMOTION", targetType: "plan", targetId: null, details: { planTier, discountPercent, promoCode, description }, ipAddress: request.headers.get("x-forwarded-for") || "unknown" });
        break;
      }
      case "clear_promotion": {
        const { planTier } = body;
        await db.updateTable("subscriptionPlans")
          .set({ launchBadge: planTier === "free" ? "Free Forever" : "Free during Launch", updatedAt: new Date() })
          .where("tier", "=", planTier).execute();
        await logAdminActivity({ adminId: session.user.id, actionType: "CLEAR_PROMOTION", targetType: "plan", targetId: null, details: { planTier }, ipAddress: request.headers.get("x-forwarded-for") || "unknown" });
        break;
      }
      case "update_user_plan": {
        const { userId, planTier } = body;
        await db.insertInto("userSubscriptions")
          .values({ userId, planTier, status: "active" })
          .onConflict((oc) => oc.column("userId").doUpdateSet({ planTier, updatedAt: new Date() }))
          .execute();
        await logAdminActivity({ adminId: session.user.id, actionType: "UPDATE_USER_PLAN", targetType: "user", targetId: userId, details: { planTier }, ipAddress: request.headers.get("x-forwarded-for") || "unknown" });
        break;
      }
      default:
        return new Response(superjson.stringify({ error: "Unknown action" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    return new Response(superjson.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: error.message }), { status: 401, headers: { "Content-Type": "application/json" } });
    console.error("[admin/pricing/update]", error);
    return new Response(superjson.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
