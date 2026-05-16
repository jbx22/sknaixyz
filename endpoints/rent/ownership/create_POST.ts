import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    // Validate total ownership <= 100%
    const existing = await db.selectFrom("propertyOwnershipShares").where("propertyId", "=", input.propertyId).select((eb) => eb.fn.sum("ownershipPercentage").as("total")).executeTakeFirst();
    const existingTotal = Number(existing?.total ?? 0);
    if (existingTotal + input.ownershipPercentage > 100) throw new Error(`Total ownership would be ${existingTotal + input.ownershipPercentage}%, exceeds 100%`);
    const share = await db.insertInto("propertyOwnershipShares").values({
      propertyId: input.propertyId, userId: input.userId, ownershipPercentage: String(input.ownershipPercentage),
      investmentAmount: String(input.investmentAmount ?? 0), acquiredAt: new Date(),
    }).returning("id").executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ success: true, share: { id: Number(share.id) } } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
