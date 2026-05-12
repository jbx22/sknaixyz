import { OutputType, SubscriptionFeatures, SubscriptionLimits } from "./status_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { SubscriptionTier } from "../../helpers/schema";

// Configuration for limits and features
const TIER_CONFIG: Record<
  SubscriptionTier,
  { limit: number; features: SubscriptionFeatures; aiReportLimit: number }
> = {
  free: {
    limit: 1,
    aiReportLimit: 10,
    features: {
      canShare: true,
      canPrint: false,
      canExportPDF: false,
      canEmailReports: false,
      canFeatureProperties: false,
    },
  },
  basic: {
    limit: 5,
    aiReportLimit: 25,
    features: {
      canShare: true,
      canPrint: true,
      canExportPDF: true,
      canEmailReports: false,
      canFeatureProperties: false,
    },
  },
  premium: {
    limit: -1, // Unlimited
    aiReportLimit: 100,
    features: {
      canShare: true,
      canPrint: true,
      canExportPDF: true,
      canEmailReports: true,
      canFeatureProperties: true,
    },
  },
};

export async function handle(request: Request) {
  try {
    // 1. Authenticate
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    // 2. Fetch Data in Parallel
    // - Current User Tier (already in session, but good to refresh if needed, though session is usually fresh enough. Let's trust session for tier to save a query, or query if we want absolute latest)
    // - Property Count
    // - Latest Active Subscription (for expiration date)
    // - User AI report usage

    const [propertiesCountResult, latestPayment, userAiReportData] = await Promise.all([
      db
        .selectFrom("properties")
        .where("userId", "=", userId)
        .select((eb) => eb.fn.count("id").as("count"))
        .executeTakeFirst(),
      db
        .selectFrom("subscriptionPayments")
        .where("userId", "=", userId)
        .where("paymentStatus", "=", "completed")
        .select(["expiresAt"])
        .orderBy("expiresAt", "desc")
        .limit(1)
        .executeTakeFirst(),
      db
        .selectFrom("users")
        .where("id", "=", userId)
        .select(["aiReportsUsed", "aiReportsResetAt"])
        .executeTakeFirstOrThrow(),
    ]);

    const propertiesCount = Number(propertiesCountResult?.count ?? 0);
    const currentTier = session.user.subscriptionTier as SubscriptionTier;
    const config = TIER_CONFIG[currentTier] || TIER_CONFIG.free;

    // 3. Check and Reset AI Report Usage if needed (monthly reset)
    let aiReportsUsed = userAiReportData.aiReportsUsed;
    let aiReportsResetAt = userAiReportData.aiReportsResetAt
      ? (typeof userAiReportData.aiReportsResetAt === "string"
          ? new Date(userAiReportData.aiReportsResetAt)
          : userAiReportData.aiReportsResetAt)
      : new Date(); // If null, set to now

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // If reset date is older than 1 month, reset the usage
    if (aiReportsResetAt < oneMonthAgo) {
      await db
        .updateTable("users")
        .set({
          aiReportsUsed: 0,
          aiReportsResetAt: now,
        })
        .where("id", "=", userId)
        .execute();

      aiReportsUsed = 0;
      aiReportsResetAt = now;
    }

    // 4. Determine if user can add more properties
    const canAddMoreProperties =
      config.limit === -1 || propertiesCount < config.limit;

    // 5. Calculate AI report remaining
    const aiReportsRemaining = Math.max(0, config.aiReportLimit - aiReportsUsed);

    // 6. Determine expiration
    // If user is free, usually no expiration unless it was a downgraded paid sub.
    // We take the latest payment expiry. If it's in the past, it might be expired,
    // but the user.subscriptionTier should reflect the current truth.
    // If the user is 'free', we return null for expiresAt unless there's some lingering logic.
    // For simplicity, we return the latest payment expiry if the user is currently on a paid tier.
    let expiresAt: Date | null = null;
    if (currentTier !== "free" && latestPayment?.expiresAt) {
      expiresAt =
        typeof latestPayment.expiresAt === "string"
          ? new Date(latestPayment.expiresAt)
          : latestPayment.expiresAt;
    }

    const response: OutputType = {
      tier: currentTier,
      expiresAt,
      propertiesCount,
      propertyLimit: config.limit,
      canAddMoreProperties,
      features: config.features,
      aiReportLimit: config.aiReportLimit,
      aiReportsUsed,
      aiReportsRemaining,
      aiReportResetDate: aiReportsResetAt,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view subscription status" }),
        { status: 401 }
      );
    }

    console.error("Subscription status error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch subscription status",
      }),
      { status: 400 }
    );
  }
}