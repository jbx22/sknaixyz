import { schema, OutputType } from "./generate_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const contract = await db.selectFrom("rentalContracts").where("id", "=", input.contractId).selectAll().executeTakeFirstOrThrow();
    if (contract.contractStatus !== "active") throw new Error("Contract is not active");
    // Find the latest invoice for this contract to determine next period
    const lastInvoice = await db.selectFrom("rentInvoices")
      .where("contractId", "=", input.contractId)
      .orderBy("periodEnd", "desc").selectAll().executeTakeFirst();
    const periodStart = lastInvoice ? new Date(lastInvoice.periodEnd) : new Date(contract.startDate);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const dueDate = new Date(periodStart);
    dueDate.setDate(contract.paymentDueDay || 1);
    if (dueDate < new Date()) dueDate.setMonth(dueDate.getMonth() + 1);
    const invoiceNum = `INV-${periodStart.getFullYear()}${String(periodStart.getMonth()+1).padStart(2,'0')}${String(periodStart.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;
    const invoice = await db.insertInto("rentInvoices").values({
      contractId: input.contractId,
      propertyId: contract.propertyId,
      tenantUserId: contract.tenantUserId,
      amount: String(contract.monthlyRent),
      dueDate,
      periodStart,
      periodEnd,
      invoiceStatus: "pending",
      paidAmount: "0",
    }).returning("id").executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ success: true, invoice: { id: Number(invoice.id) } } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
