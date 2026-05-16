import { schema, OutputType } from "./properties_GET.schema";
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
    const rows = await db.selectFrom("propertyOwnershipShares").where("userId", "=", session.user.id).selectAll().limit(input.limit).offset(offset).execute();
    const mapped = rows.map(r => ({ propertyId: r.propertyId, ownershipPercentage: Number(r.ownershipPercentage), investmentAmount: Number(r.investmentAmount), acquiredAt: r.acquiredAt }));
    return new Response(superjson.stringify({ properties: mapped, total: rows.length, page: input.page, limit: input.limit } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
