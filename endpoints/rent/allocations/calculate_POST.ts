import { schema, OutputType } from "./calculate_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { notifyInvestor } from "../../../helpers/notify";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);
    // Get gross income from paid invoices in the period
    const incomeResult = await db.selectFrom("rentInvoices")
      .where("propertyId", "=", input.propertyId)
      .where("invoiceStatus", "=", "paid")
      .where("periodStart", ">=", periodStart)
      .where("periodEnd", "<=", periodEnd)
      .select((eb) => eb.fn.sum("amount").as("gross"))
      .executeTakeFirst();
    const grossIncome = Number(incomeResult?.gross ?? 0);
    // Get expenses in the period
    const expenseResult = await db.selectFrom("propertyExpenses")
      .where("propertyId", "=", input.propertyId)
      .where("expenseDate", ">=", periodStart)
      .where("expenseDate", "<=", periodEnd)
      .select((eb) => eb.fn.sum("amount").as("total"))
      .executeTakeFirst();
    const totalExpenses = Number(expenseResult?.total ?? 0);
    const netIncome = grossIncome - totalExpenses;
    // Get ownership shares
    const shares = await db.selectFrom("propertyOwnershipShares")
      .where("propertyId", "=", input.propertyId)
      .selectAll().execute();
    if (shares.length === 0) throw new Error("No ownership shares found for this property");
    let count = 0;
    for (const share of shares) {
      const pct = Number(share.ownershipPercentage);
      const investorShare = netIncome * pct / 100;
      await db.insertInto("rentalIncomeAllocations").values({
        propertyId: input.propertyId,
        ownerUserId: share.userId,
        ownershipShareId: share.id,
        periodStart, periodEnd,
        totalIncome: String(grossIncome),
        totalExpenses: String(totalExpenses),
        netIncome: String(netIncome),
        allocatedAmount: String(investorShare),
        allocationStatus: "calculated",
      }).execute();
      await notifyInvestor(share.userId, "allocation_ready", {
        propertyTitle: (await db.selectFrom("properties").where("id", "=", input.propertyId).select(["title"]).executeTakeFirst())?.title || "Property",
        amount: investorShare,
      });
      count++;
    }
    return new Response(superjson.stringify({ success: true, allocationsCreated: count } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
