import { schema, OutputType } from "./create_POST.schema";
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
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const contract = await db.insertInto("rentalContracts").values({
      propertyId: input.propertyId,
      unitId: input.unitId ?? null,
      landlordUserId: input.landlordUserId,
      tenantUserId: input.tenantUserId,
      monthlyRent: String(input.monthlyRent),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      securityDeposit: String(input.securityDeposit ?? 0),
      paymentDueDay: input.paymentDueDay ?? 1,
      autoGenerateInvoice: input.autoGenerateInvoice ?? true,
      notes: input.notes ?? null,
      contractStatus: "active",
    }).returning("id").executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ success: true, contract: { id: Number(contract.id) } } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
