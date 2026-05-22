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
      status: sp.status || undefined,
    });
    const offset = (input.page - 1) * input.limit;
    let q = db.selectFrom("propertyUnits").selectAll();
    if (input.propertyId) q = q.where("propertyId", "=", input.propertyId);
    if (input.status) q = q.where("propertyUnits.status", "=", input.status);
    let countQ = db.selectFrom("propertyUnits");

if (input.propertyId) countQ = countQ.where("propertyId", "=", input.propertyId);
if (input.status) countQ = countQ.where("propertyUnits.status", "=", input.status);
    const countR = await countQ.select((eb) => eb.fn.count("propertyUnits.id").as("cnt")).executeTakeFirst();
    const total = Number(countR?.cnt ?? 0);
    const units = await q
      .selectAll()
      .orderBy("propertyUnits.createdAt", "desc")
      .limit(input.limit)
      .offset(offset)
      .execute();
    const mapped = units.map(u => ({ ...u, areaSqm: Number(u.areaSqm ?? 0), bathrooms: Number(u.bathrooms ?? 0), monthlyRent: Number(u.monthlyRent ?? 0) }));
    return new Response(superjson.stringify({ units: mapped, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
