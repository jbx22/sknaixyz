import { schema, OutputType } from "./list_GET.schema";
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
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({
      page: sp.page ? Number(sp.page) : 1,
      limit: sp.limit ? Number(sp.limit) : 20,
      contractId: sp.contractId ? Number(sp.contractId) : undefined,
      propertyId: sp.propertyId ? Number(sp.propertyId) : undefined,
      tenantUserId: sp.tenantUserId ? Number(sp.tenantUserId) : undefined,
      invoiceStatus: sp.invoiceStatus || undefined,
    });
    const offset = (input.page - 1) * input.limit;
    let q = db.selectFrom("rentInvoices").selectAll();
    if (input.contractId) q = q.where("contractId", "=", input.contractId);
    if (input.propertyId) q = q.where("propertyId", "=", input.propertyId);
    if (input.tenantUserId) q = q.where("tenantUserId", "=", input.tenantUserId);
    if (input.invoiceStatus) q = q.where("invoiceStatus", "=", input.invoiceStatus);
    // Separate count query (cannot reuse 'q' which has selectAll())
    let countQ = db.selectFrom("rentInvoices");
    if (input.contractId) countQ = countQ.where("contractId", "=", input.contractId);
    if (input.propertyId) countQ = countQ.where("propertyId", "=", input.propertyId);
    if (input.tenantUserId) countQ = countQ.where("tenantUserId", "=", input.tenantUserId);
    if (input.invoiceStatus) countQ = countQ.where("invoiceStatus", "=", input.invoiceStatus);
    const countR = await countQ.select((eb) => eb.fn.count("rentInvoices.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const invoices = await q.orderBy("rentInvoices.dueDate", "desc").limit(input.limit).offset(offset).execute();
    const mapped = invoices.map(i => ({ ...i, amount: Number(i.amount), paidAmount: Number(i.paidAmount) }));
    return new Response(superjson.stringify({ invoices: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
