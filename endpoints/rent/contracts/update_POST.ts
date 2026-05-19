import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { notifyTenant } from "../../../helpers/notify";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const values: Record<string, unknown> = {};
    if (input.contractStatus) values.contractStatus = input.contractStatus;
    if (input.monthlyRent !== undefined) values.monthlyRent = String(input.monthlyRent);
    if (input.endDate) values.endDate = new Date(input.endDate);
    if (input.notes !== undefined) values.notes = input.notes;
    values.updatedAt = new Date();
    if (Object.keys(values).length === 1) return new Response(superjson.stringify({ error: "No fields to update" }), { status: 400 });
    await db.updateTable("rentalContracts").set(values).where("id", "=", input.contractId).execute();

    // Notify tenant about contract status change
    if (input.contractStatus) {
      const contract = await db.selectFrom("rentalContracts")
        .innerJoin("properties", "properties.id", "rentalContracts.propertyId")
        .where("rentalContracts.id", "=", input.contractId)
        .select(["rentalContracts.tenantUserId", "properties.title as propertyTitle", "rentalContracts.endDate"])
        .executeTakeFirst();
      if (contract) {
        if (input.contractStatus === "active") {
          // Check if this is a renewal (contract was previously active or expiring)
          const endDate = contract.endDate ? new Date(contract.endDate).toLocaleDateString() : undefined;
          if (input.endDate && endDate) {
            await notifyTenant(contract.tenantUserId, "contract_renewed", { propertyTitle: contract.propertyTitle, endDate: new Date(input.endDate).toLocaleDateString() });
          } else {
            await notifyTenant(contract.tenantUserId, "application_approved", { propertyTitle: contract.propertyTitle });
          }
        } else if (input.contractStatus === "terminated") {
          await notifyTenant(contract.tenantUserId, "application_rejected", { propertyTitle: contract.propertyTitle });
        }
      }
    }

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
