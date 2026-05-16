import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const url = new URL(request.url); const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({ page: sp.page ? Number(sp.page) : 1, limit: sp.limit ? Number(sp.limit) : 20, propertyId: sp.propertyId ? Number(sp.propertyId) : undefined, ownerUserId: sp.ownerUserId ? Number(sp.ownerUserId) : undefined, allocationStatus: sp.allocationStatus || undefined });
    const offset = (input.page - 1) * input.limit;
    let q = db.selectFrom("rentalIncomeAllocations").selectAll();
    if (input.propertyId) q = q.where("propertyId", "=", input.propertyId);
    if (input.ownerUserId) q = q.where("ownerUserId", "=", input.ownerUserId);
    if (input.allocationStatus) q = q.where("allocationStatus", "=", input.allocationStatus);
    const countR = await q.select((eb) => eb.fn.count("rentalIncomeAllocations.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const rows = await q.orderBy("rentalIncomeAllocations.createdAt", "desc").limit(input.limit).offset(offset).execute();
    const mapped = rows.map(r => ({ ...r, totalIncome: Number(r.totalIncome), totalExpenses: Number(r.totalExpenses), netIncome: Number(r.netIncome), allocatedAmount: Number(r.allocatedAmount) }));
    return new Response(superjson.stringify({ allocations: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
