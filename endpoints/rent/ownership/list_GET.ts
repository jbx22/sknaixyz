import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({ page: sp.page ? Number(sp.page) : 1, limit: sp.limit ? Number(sp.limit) : 20, propertyId: sp.propertyId ? Number(sp.propertyId) : undefined, userId: sp.userId ? Number(sp.userId) : undefined });
    const offset = (input.page - 1) * input.limit;
    let q = db.selectFrom("propertyOwnershipShares").selectAll();
    if (input.propertyId) q = q.where("propertyId", "=", input.propertyId);
    if (input.userId) q = q.where("userId", "=", input.userId);
    let countQ = db.selectFrom("propertyOwnershipShares");

if (input.propertyId) countQ = countQ.where("propertyId", "=", input.propertyId);
if (input.userId) countQ = countQ.where("userId", "=", input.userId);
    const countR = await countQ.select((eb) => eb.fn.count("propertyOwnershipShares.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const shares = await q.orderBy("propertyOwnershipShares.createdAt", "desc").limit(input.limit).offset(offset).execute();
    const mapped = shares.map(s => ({ ...s, ownershipPercentage: Number(s.ownershipPercentage), investmentAmount: Number(s.investmentAmount) }));
    return new Response(superjson.stringify({ shares: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
