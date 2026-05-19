import { schema, OutputType } from "./record_POST.schema";
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
    const invoice = await db.selectFrom("rentInvoices").where("id", "=", input.invoiceId).select(["propertyId"]).executeTakeFirstOrThrow();
    const payment = await db.insertInto("rentPayments").values({
      invoiceId: input.invoiceId,
      contractId: input.contractId,
      tenantUserId: input.tenantUserId,
      propertyId: invoice.propertyId,
      amount: String(input.amount),
      paymentMethod: input.paymentMethod,
      paymentStatus: "completed",
      paymentDate: new Date(),
      transactionReference: input.transactionReference ?? null,
      notes: input.notes ?? null,
      recordedBy: session.user.id,
    }).returning("id").executeTakeFirstOrThrow();
    // Update invoice
    await db.updateTable("rentInvoices").set({
      invoiceStatus: "paid",
      paidAmount: String(input.amount),
      paidAt: new Date(),
      updatedAt: new Date(),
    }).where("id", "=", input.invoiceId).execute();

    // Notify tenant + landlord
    await notifyTenant(input.tenantUserId, "payment_confirmed", { amount: input.amount });
    const contract = await db.selectFrom("rentalContracts").where("id", "=", input.contractId).select(["landlordUserId"]).executeTakeFirst();
    if (contract) await notifyLandlord(contract.landlordUserId, "payment_received", { amount: input.amount, tenantId: input.tenantUserId });

    return new Response(superjson.stringify({ success: true, payment: { id: Number(payment.id) } } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
