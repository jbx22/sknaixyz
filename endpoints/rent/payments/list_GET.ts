import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin" && session.user.role !== "user") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({
      page: sp.page ? Number(sp.page) : 1,
      limit: sp.limit ? Number(sp.limit) : 20,
      contractId: sp.contractId ? Number(sp.contractId) : undefined,
      tenantUserId: sp.tenantUserId ? Number(sp.tenantUserId) : undefined,
      paymentStatus: sp.paymentStatus || undefined,
    });
    const offset = (input.page - 1) * input.limit;
    let q = db.selectFrom("rentPayments").selectAll();
    if (input.contractId) q = q.where("contractId", "=", input.contractId);
    if (input.tenantUserId) q = q.where("tenantUserId", "=", input.tenantUserId);
    if (input.paymentStatus) q = q.where("paymentStatus", "=", input.paymentStatus);
    let countQ = db.selectFrom("rentPayments");

if (input.contractId) countQ = countQ.where("contractId", "=", input.contractId);
if (input.tenantUserId) countQ = countQ.where("tenantUserId", "=", input.tenantUserId);
if (input.paymentStatus) countQ = countQ.where("paymentStatus", "=", input.paymentStatus);
    const countR = await countQ.select((eb) => eb.fn.count("rentPayments.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const payments = await q.orderBy("rentPayments.createdAt", "desc").limit(input.limit).offset(offset).execute();
    const mapped = payments.map(p => ({ ...p, amount: Number(p.amount) }));
    return new Response(superjson.stringify({ payments: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
