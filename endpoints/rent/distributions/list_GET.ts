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
    const input = schema.parse({ page: sp.page ? Number(sp.page) : 1, limit: sp.limit ? Number(sp.limit) : 20, investorUserId: sp.investorUserId ? Number(sp.investorUserId) : undefined, distributionStatus: sp.distributionStatus || undefined });
    const offset = (input.page - 1) * input.limit;
    let q = db.selectFrom("investorDistributions").selectAll();
    if (input.investorUserId) q = q.where("investorUserId", "=", input.investorUserId);
    if (input.distributionStatus) q = q.where("distributionStatus", "=", input.distributionStatus);
    let countQ = db.selectFrom("investorDistributions");

if (input.investorUserId) countQ = countQ.where("investorUserId", "=", input.investorUserId);
if (input.distributionStatus) countQ = countQ.where("distributionStatus", "=", input.distributionStatus);
    const countR = await countQ.select((eb) => eb.fn.count("investorDistributions.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const rows = await q.orderBy("investorDistributions.createdAt", "desc").limit(input.limit).offset(offset).execute();
    const mapped = rows.map(r => ({ ...r, amount: Number(r.amount) }));
    return new Response(superjson.stringify({ distributions: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
