import { schema, OutputType } from "./export-csv_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const url = new URL(request.url); const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({ type: sp.type, propertyId: sp.propertyId ? Number(sp.propertyId) : undefined, contractId: sp.contractId ? Number(sp.contractId) : undefined, periodStart: sp.periodStart, periodEnd: sp.periodEnd });
    let csv = "";
    if (input.type === "invoices") {
      let q = db.selectFrom("rentInvoices").selectAll();
      if (input.propertyId) q = q.where("propertyId", "=", input.propertyId);
      if (input.contractId) q = q.where("contractId", "=", input.contractId);
      const rows = await q.orderBy("dueDate", "desc").limit(1000).execute();
      csv = "ID,ContractID,PropertyID,TenantID,Amount,Status,DueDate,PeriodStart,PeriodEnd,PaidAmount,PaidAt\n";
      for (const r of rows) { csv += `${r.id},${r.contractId},${r.propertyId},${r.tenantUserId},${r.amount},${r.invoiceStatus},${r.dueDate?.toISOString() ?? ""},${r.periodStart?.toISOString() ?? ""},${r.periodEnd?.toISOString() ?? ""},${r.paidAmount},${r.paidAt?.toISOString() ?? ""}\n`; }
    } else {
      let q = db.selectFrom("rentPayments").selectAll();
      if (input.propertyId) q = q.where("propertyId", "=", input.propertyId);
      if (input.contractId) q = q.where("contractId", "=", input.contractId);
      const rows = await q.orderBy("createdAt", "desc").limit(1000).execute();
      csv = "ID,InvoiceID,ContractID,TenantID,PropertyID,Amount,Method,Status,PaymentDate,Reference\n";
      for (const r of rows) { csv += `${r.id},${r.invoiceId},${r.contractId},${r.tenantUserId},${r.propertyId},${r.amount},${r.paymentMethod},${r.paymentStatus},${r.paymentDate?.toISOString() ?? ""},${r.transactionReference ?? ""}\n`; }
    }
    const filename = `sknai-rent-${input.type}-${new Date().toISOString().slice(0,10)}.csv`;
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${filename}"` } });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
