import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { db } from '../../../../helpers/db';
import { getServerUserSession } from '../../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../../helpers/getSetServerSession';
import { logAdminActivity } from '../../../../helpers/logAdminActivity';

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await request.text();
    const json = superjson.parse(body);
    const input = schema.parse(json);

    const existingOffering = await db.
    selectFrom("tokenizedAssets").
    selectAll().
    where("id", "=", input.assetId).
    executeTakeFirst();

    if (!existingOffering) {
      return new Response(superjson.stringify({ error: "Offering not found" }), { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (input.offeringStatus) updateData.offeringStatus = input.offeringStatus;
    if (input.tokenPrice !== undefined) updateData.tokenPrice = input.tokenPrice.toString();
    if (input.annualRentalYield !== undefined) updateData.annualRentalYield = input.annualRentalYield.toString();
    if (input.incomeRights !== undefined) updateData.incomeRights = input.incomeRights;
    if (input.votingRights !== undefined) updateData.votingRights = input.votingRights;
    if (input.lockUpDays !== undefined) updateData.lockUpDays = input.lockUpDays;
    if (input.transferable !== undefined) updateData.transferable = input.transferable;
    if (input.titleDeedUrl !== undefined) updateData.titleDeedUrl = input.titleDeedUrl;
    if (input.valuationReportUrl !== undefined) updateData.valuationReportUrl = input.valuationReportUrl;

    // If status is changing to settled, set settledAt
    if (input.offeringStatus === "settled" && existingOffering.offeringStatus !== "settled") {
      updateData.settledAt = new Date();
    }

    const updatedOffering = await db.
    updateTable("tokenizedAssets").
    set(updateData).
    where("id", "=", input.assetId).
    returningAll().
    executeTakeFirstOrThrow();

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "UPDATE_OFFERING",
      targetType: "TOKENIZED_ASSET",
      targetId: input.assetId,
      details: {
        previous: existingOffering,
        updated: updateData
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    });

    return new Response(superjson.stringify({ offering: updatedOffering } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}