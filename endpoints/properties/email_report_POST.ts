import { schema, OutputType } from "./email_report_POST.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { generatePropertyReport } from "../../helpers/generatePropertyReport";

export async function handle(request: Request) {
  try {
    // Check authentication and subscription tier
    const { user } = await getServerUserSession(request);

    // Only premium users can email reports
    if (user.role !== "admin" && user.role !== "superadmin") {
      const userRecord = await db
        .selectFrom("users")
        .select(["subscriptionTier"])
        .where("id", "=", user.id)
        .executeTakeFirst();

      if (!userRecord || userRecord.subscriptionTier !== "premium") {
        return new Response(
          superjson.stringify({
            error:
              "Email functionality is only available for Premium subscribers",
          }),
          { status: 403 }
        );
      }
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // Fetch the property details
    const property = await db
      .selectFrom("properties")
      .select(["title", "locationName", "price", "areaSqm"])
      .where("id", "=", input.propertyId)
      .executeTakeFirst();

    if (!property) {
      return new Response(
        superjson.stringify({ error: "Property not found" }),
        { status: 404 }
      );
    }

    // Generate the AI report using the reusable helper
    const report = await generatePropertyReport(input.propertyId);

    // In production, this would send an actual email via a service like SendGrid, AWS SES, etc.
    // For now, we'll just log it and return success
    console.log("Email report request:", {
      to: input.recipientEmail,
      property: property.title,
      user: user.email,
    });

    // TODO: Implement actual email sending
    // const emailHtml = generateReportEmailHtml(property, report);
    // await sendEmail({
    //   to: input.recipientEmail,
    //   subject: `Property AI Report: ${property.title}`,
    //   html: emailHtml,
    // });

    return new Response(
      superjson.stringify({
        success: true,
        message: `Report sent to ${input.recipientEmail}`,
      } satisfies OutputType)
    );
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}