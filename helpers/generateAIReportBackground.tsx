import { db } from "./db";
import { generatePropertyReport } from "./generatePropertyReport";
import { SubscriptionTier } from "./schema";

/**
 * Background helper to generate AI reports for properties based on subscription tier.
 * This function is designed to be "fire and forget" - it handles its own errors
 * and updates the database status accordingly.
 *
 * Logic:
 * - FREE tier: Skipped (returns immediately)
 * - BASIC/PREMIUM tier: Generates report automatically
 */
export async function generateAIReportBackground(
  propertyId: number,
  subscriptionTier: SubscriptionTier
): Promise<void> {
  // 1. Check subscription tier logic
  // Free tier users do not get automatic AI reports
  if (subscriptionTier === "free") {
    return;
  }

  try {
    // 2. Set status to pending immediately
    await db
      .updateTable("properties")
      .set({
        aiReportStatus: "pending",
        aiReportError: null,
      })
      .where("id", "=", propertyId)
      .execute();

    // 3. Generate the report
    // We default to 'ar' as it's the primary language of the platform.
    // In a more complex scenario, we might check the user's preferred language.
    const report = await generatePropertyReport(propertyId, "ar");

    // 4. Store success result
    await db
      .updateTable("properties")
      .set({
        aiReportStatus: "completed",
        aiReportData: report, // Kysely/Postgres driver handles JSON serialization
        aiReportGeneratedAt: new Date(),
      })
      .where("id", "=", propertyId)
      .execute();
  } catch (error) {
    // Log for debugging purposes
    console.error(
      `[Background Job] Failed to generate AI report for property ${propertyId}:`,
      error
    );

    // 5. Store failure result so the UI can show an error or retry button
    try {
      await db
        .updateTable("properties")
        .set({
          aiReportStatus: "failed",
          aiReportError:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
        .where("id", "=", propertyId)
        .execute();
    } catch (dbError) {
      // If even the error logging fails (e.g. DB down), we just log to console
      console.error(
        `[Background Job] Critical: Failed to update error status for property ${propertyId}`,
        dbError
      );
    }
  }
}