import { schema, OutputType } from "./allocations_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const url = new URL(request.url); const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({ page: sp.page ? Number(sp.page) : 1, limit: sp.limit ? Number(sp.limit) : 20 });
    const offset = (input.page - 1) * input.limit;
    const rows = await db.selectFrom("rentalIncomeAllocations").where("ownerUserId", "=", session.user.id).selectAll().orderBy("createdAt", "desc").limit(input.limit).offset(offset).execute();
    const mapped = rows.map(r => ({ ...r, totalIncome: Number(r.totalIncome), totalExpenses: Number(r.totalExpenses), netIncome: Number(r.netIncome), allocatedAmount: Number(r.allocatedAmount) }));
    return new Response(superjson.stringify({ allocations: mapped, total: rows.length, page: input.page, limit: input.limit } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
