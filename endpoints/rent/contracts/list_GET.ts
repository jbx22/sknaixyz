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
      propertyId: sp.propertyId ? Number(sp.propertyId) : undefined,
      landlordId: sp.landlordId ? Number(sp.landlordId) : undefined,
      tenantId: sp.tenantId ? Number(sp.tenantId) : undefined,
      contractStatus: sp.contractStatus || undefined,
    });
    const offset = (input.page - 1) * input.limit;
    // Base filter query
    let q = db.selectFrom("rentalContracts").selectAll();
    if (input.propertyId) q = q.where("propertyId", "=", input.propertyId);
    if (input.landlordId) q = q.where("landlordUserId", "=", input.landlordId);
    if (input.tenantId) q = q.where("tenantUserId", "=", input.tenantId);
    if (input.contractStatus) q = q.where("contractStatus", "=", input.contractStatus);
    // Separate count query (cannot reuse 'q' because selectAll() + count() creates invalid SQL)
    let countQ = db.selectFrom("rentalContracts");
    if (input.propertyId) countQ = countQ.where("propertyId", "=", input.propertyId);
    if (input.landlordId) countQ = countQ.where("landlordUserId", "=", input.landlordId);
    if (input.tenantId) countQ = countQ.where("tenantUserId", "=", input.tenantId);
    if (input.contractStatus) countQ = countQ.where("contractStatus", "=", input.contractStatus);
    const countR = await countQ.select((eb) => eb.fn.count("rentalContracts.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const contracts = await q.orderBy("rentalContracts.createdAt", "desc").limit(input.limit).offset(offset).execute();
    const mapped = contracts.map(c => ({ ...c, monthlyRent: Number(c.monthlyRent), securityDeposit: Number(c.securityDeposit) }));
    return new Response(superjson.stringify({ contracts: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
