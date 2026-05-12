import { schema, OutputType, AIReport } from "./ai_report_POST.schema";
import superjson from "superjson";
import { generatePropertyReport } from "../../helpers/generatePropertyReport";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { SubscriptionTier } from "../../helpers/schema";

// Define AI report limits per tier
const AI_REPORT_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  basic: 30,
  premium: 100,
};

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
      ])
      .where("id", "=", userId)
      .executeTakeFirstOrThrow();

    let aiReportsUsed = user.aiReportsUsed;
    let aiReportsResetAt = user.aiReportsResetAt
      ? (typeof user.aiReportsResetAt === "string"
          ? new Date(user.aiReportsResetAt)
          : user.aiReportsResetAt)
      : new Date(); // If null, set to now

    // 3. Check if ai_reports_reset_at is older than 1 month - if so, reset
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

    // 4. Get the limit for the user's tier
    const currentTier = user.subscriptionTier as SubscriptionTier;
    const limit = AI_REPORT_LIMITS[currentTier] || AI_REPORT_LIMITS.free;

    // 5. Check if the property already has a completed AI report
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
    // No need to check limits or increment usage for cached reports
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
        } satisfies OutputType)
      );
    }

    // 6. Check if user has reached their limit (only for NEW report generation)
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

    // If no report exists, status is 'failed', or 'pending', generate a new report
    console.log(
      `Generating new AI report for property ${input.propertyId} (status: ${property.aiReportStatus || "null"})`
    );

    try {
      // Generate the AI report using the reusable helper
      const report = await generatePropertyReport(
        input.propertyId,
        input.language || "ar"
      );

      // Update the database with the generated report and increment usage
      await db.transaction().execute(async (trx) => {
        // Update property with the report
        await trx
          .updateTable("properties")
          .set({
            aiReportData: report as unknown as string,
            aiReportStatus: "completed",
            aiReportGeneratedAt: new Date(),
            aiReportError: null, // Clear any previous error
          })
          .where("id", "=", input.propertyId)
          .execute();

        // 7. Increment ai_reports_used by 1
        await trx
          .updateTable("users")
          .set({
            aiReportsUsed: aiReportsUsed + 1,
          })
          .where("id", "=", userId)
          .execute();
      });

      console.log(
        `Successfully generated and cached AI report for property ${input.propertyId}. User ${userId} usage: ${aiReportsUsed + 1}/${limit}`
      );

      return new Response(
        superjson.stringify({ report } satisfies OutputType)
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