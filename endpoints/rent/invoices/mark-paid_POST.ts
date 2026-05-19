import { schema, OutputType } from "./mark-paid_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { notifyTenant, notifyLandlord } from "../../../helpers/notify";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const invoice = await db.selectFrom("rentInvoices").where("id", "=", input.invoiceId).selectAll().executeTakeFirstOrThrow();
    await db.updateTable("rentInvoices").set({
      invoiceStatus: "paid",
      paidAmount: invoice.amount,
      paidAt: new Date(),
      updatedAt: new Date(),
    }).where("id", "=", input.invoiceId).execute();

    // Notify tenant + landlord
    await notifyTenant(invoice.tenantUserId, "payment_confirmed", { amount: invoice.amount });
    const contract = await db.selectFrom("rentalContracts").where("id", "=", invoice.contractId).select(["landlordUserId"]).executeTakeFirst();
    if (contract) await notifyLandlord(contract.landlordUserId, "payment_received", { amount: invoice.amount, tenantId: invoice.tenantUserId });

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
