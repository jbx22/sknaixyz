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
    const allocation = await db.selectFrom("rentalIncomeAllocations").where("id", "=", input.allocationId).selectAll().executeTakeFirstOrThrow();
    await db.insertInto("investorDistributions").values({
      allocationId: allocation.id,
      investorUserId: allocation.ownerUserId,
      propertyId: allocation.propertyId,
      amount: allocation.allocatedAmount,
      distributionStatus: "pending",
      notes: input.notes ?? null,
    }).execute();
    await db.updateTable("rentalIncomeAllocations").set({ allocationStatus: "pending", updatedAt: new Date() }).where("id", "=", input.allocationId).execute();
    return new Response(superjson.stringify({ success: true, distributionsCreated: 1 } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
