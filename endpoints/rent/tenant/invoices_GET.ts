import { schema, OutputType } from "./invoices_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const url = new URL(request.url); const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({ page: sp.page ? Number(sp.page) : 1, limit: sp.limit ? Number(sp.limit) : 20, invoiceStatus: sp.invoiceStatus || undefined });
    const offset = (input.page - 1) * input.limit;
    let q = db.selectFrom("rentInvoices").where("tenantUserId", "=", session.user.id);
    if (input.invoiceStatus) q = q.where("invoiceStatus", "=", input.invoiceStatus);
    const countR = await q.select((eb) => eb.fn.count("rentInvoices.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const invoices = await q.orderBy("dueDate", "desc").limit(input.limit).offset(offset).execute();
    const mapped = invoices.map(i => ({ ...i, amount: Number(i.amount), paidAmount: Number(i.paidAmount) }));
    return new Response(superjson.stringify({ invoices: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
