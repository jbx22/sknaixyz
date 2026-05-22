import { schema, OutputType, AIReport } from "./ai_report_POST.schema";
import superjson from "superjson";
import { generatePropertyReport } from "../../helpers/generatePropertyReport";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { SubscriptionTier } from "../../helpers/schema";
import type { ReportTier } from "../../helpers/prompts";

// Define AI report limits per tier
const AI_REPORT_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  basic: 30,
  premium: 100,
};

/**
 * Maps a user's subscription tier to the maximum report tier they can access.
 * Free users get the "free" report; premium users can request "premium".
 */
function resolveAllowedTier(subscriptionTier: SubscriptionTier): ReportTier {
  if (subscriptionTier === "premium") return "premium";
  return "free";
}

export async function handle(request: Request) {
  try {
    // 1. Authenticate the user
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // 2. Get user's subscription info and AI report usage
    const user = await db
      .selectFrom("users")
      .select([
        "subscriptionTier",
        "aiReportsUsed",
        "aiReportsResetAt",
        "displayName",
      ])
      .where("id", "=", userId)
      .executeTakeFirstOrThrow();

    // 3. Determine which report tier the user is allowed to access
    const allowedTier = resolveAllowedTier(user.subscriptionTier as SubscriptionTier);
    
    // If user requested premium but isn't premium, silently downgrade
    const effectiveTier: ReportTier =
      input.tier === "premium" && allowedTier === "premium" ? "premium" : "free";

    let aiReportsUsed = user.aiReportsUsed;
    let aiReportsResetAt = user.aiReportsResetAt
      ? (typeof user.aiReportsResetAt === "string"
          ? new Date(user.aiReportsResetAt)
          : user.aiReportsResetAt)
      : new Date(); // If null, set to now

    // 4. Check if ai_reports_reset_at is older than 1 month - if so, reset
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

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
      console.log(`Reset AI report usage for user ${userId}`);
    }

    // 5. Get the limit for the user's tier
    const currentTier = user.subscriptionTier as SubscriptionTier;
    const limit = AI_REPORT_LIMITS[currentTier] || AI_REPORT_LIMITS.free;

    // 6. Check if the property already has a completed AI report
    const property = await db
      .selectFrom("properties")
      .select([
        "id",
        "aiReportStatus",
        "aiReportData",
        "aiReportGeneratedAt",
      ])
      .where("id", "=", input.propertyId)
      .executeTakeFirst();

    if (!property) {
      return new Response(
        superjson.stringify({ error: "Property not found" }),
        { status: 404 }
      );
    }

    // If a completed report exists, return it immediately (fast response)
    if (
      property.aiReportStatus === "completed" &&
      property.aiReportData !== null
    ) {
      console.log(
        `Returning cached AI report for property ${input.propertyId}`
      );
      return new Response(
        superjson.stringify({
          report: property.aiReportData as unknown as AIReport,
          tier: effectiveTier,
        } satisfies OutputType & { tier: string })
      );
    }

    // 7. Check if user has reached their limit (only for NEW report generation)
    if (aiReportsUsed >= limit) {
      const remaining = 0;
      console.log(
        `User ${userId} has reached AI report limit (${aiReportsUsed}/${limit})`
      );
      return new Response(
        superjson.stringify({
          error: `You have reached your AI report limit of ${limit} reports per month. Please upgrade your subscription or wait until your limit resets to generate more reports.`,
          remaining,
          limit,
        }),
        { status: 403 }
      );
    }

    // If no report exists, generate a new one
    console.log(
      `Generating new ${effectiveTier} AI report for property ${input.propertyId} (user tier: ${user.subscriptionTier})`
    );

    try {
      // Generate the AI report using the reusable helper
      const report = await generatePropertyReport(
        input.propertyId,
        input.language || "ar",
        effectiveTier,
        {
          userName: user.displayName || undefined,
          investorProfile: effectiveTier === "premium" ? "Premium Member" : undefined,
        }
      );

      // Update the database with the generated report and increment usage
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("properties")
          .set({
            aiReportData: report as unknown as string,
            aiReportStatus: "completed",
            aiReportGeneratedAt: new Date(),
            aiReportError: null,
          })
          .where("id", "=", input.propertyId)
          .execute();

        await trx
          .updateTable("users")
          .set({
            aiReportsUsed: aiReportsUsed + 1,
          })
          .where("id", "=", userId)
          .execute();
      });

      console.log(
        `Successfully generated ${effectiveTier} report for property ${input.propertyId}. User ${userId} usage: ${aiReportsUsed + 1}/${limit}`
      );

      return new Response(
        superjson.stringify({ report, tier: effectiveTier } satisfies OutputType & { tier: string })
      );
    } catch (generationError) {
      // If generation fails, update status to 'failed' and store the error
      const errorMessage =
        generationError instanceof Error
          ? generationError.message
          : "Unknown error during report generation";

      await db
        .updateTable("properties")
        .set({
          aiReportStatus: "failed",
          aiReportError: errorMessage,
        })
        .where("id", "=", input.propertyId)
        .execute();

      console.error(
        `Failed to generate AI report for property ${input.propertyId}:`,
        errorMessage
      );

      return new Response(
        superjson.stringify({
          error: `Failed to generate AI report: ${errorMessage}`,
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to generate AI reports" }),
        { status: 401 }
      );
    }

    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}
