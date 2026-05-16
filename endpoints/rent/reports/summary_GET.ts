import { schema, OutputType } from "./summary_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const url = new URL(request.url); const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({ propertyId: sp.propertyId ? Number(sp.propertyId) : undefined });
    let invoiceQ = db.selectFrom("rentInvoices");
    if (input.propertyId) invoiceQ = invoiceQ.where("propertyId", "=", input.propertyId);
    const totals = await invoiceQ.select((eb) => [
      eb.fn.sum("amount").as("totalDue"),
      eb.fn.sum(eb.case().when("invoiceStatus", "=", "paid").then("amount").else("0").end()).as("totalCollected"),
      eb.fn.sum(eb.case().when("invoiceStatus", "=", "overdue").then("amount").else("0").end()).as("totalOverdue"),
    ]).executeTakeFirst();
    let contractQ = db.selectFrom("rentalContracts").where("contractStatus", "=", "active");
    if (input.propertyId) contractQ = contractQ.where("propertyId", "=", input.propertyId);
    const contractCount = await contractQ.select((eb) => eb.fn.count("id").as("cnt")).executeTakeFirst();
    let unitQ = db.selectFrom("propertyUnits");
    if (input.propertyId) unitQ = unitQ.where("propertyId", "=", input.propertyId);
    const unitStats = await unitQ.select((eb) => [
      eb.fn.count("id").as("total"),
      eb.fn.sum(eb.case().when("propertyUnits.status", "=", "rented").then("1").else("0").end()).as("occupied"),
    ]).executeTakeFirst();
    const totalDue = Number(totals?.totalDue ?? 0);
    const totalCollected = Number(totals?.totalCollected ?? 0);
    const totalOverdue = Number(totals?.totalOverdue ?? 0);
    const activeContracts = Number(contractCount?.cnt ?? 0);
    const totalUnits = Number(unitStats?.total ?? 0);
    const occupiedUnits = Number(unitStats?.occupied ?? 0);
    return new Response(superjson.stringify({
      totalDue, totalCollected, totalOverdue,
      collectionRate: totalDue > 0 ? Math.round(totalCollected / totalDue * 100) : 0,
      activeContracts, totalUnits, occupiedUnits,
      occupancyRate: totalUnits > 0 ? Math.round(occupiedUnits / totalUnits * 100) : 0,
    } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
