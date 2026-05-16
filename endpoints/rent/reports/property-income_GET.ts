import { schema, OutputType } from "./property-income_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const url = new URL(request.url); const sp = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse({ propertyId: Number(sp.propertyId), periodStart: sp.periodStart, periodEnd: sp.periodEnd });
    const ps = new Date(input.periodStart); const pe = new Date(input.periodEnd);
    const incomeR = await db.selectFrom("rentInvoices").where("propertyId", "=", input.propertyId).where("invoiceStatus", "=", "paid").where("periodStart", ">=", ps).where("periodEnd", "<=", pe).select((eb) => eb.fn.sum("amount").as("gross")).executeTakeFirst();
    const grossRentIncome = Number(incomeR?.gross ?? 0);
    const expenses = await db.selectFrom("propertyExpenses").where("propertyId", "=", input.propertyId).where("expenseDate", ">=", ps).where("expenseDate", "<=", pe).selectAll().execute();
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses) { const cat = e.category; expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(e.amount); }
    return new Response(superjson.stringify({
      propertyId: input.propertyId, periodStart: input.periodStart, periodEnd: input.periodEnd,
      grossRentIncome, totalExpenses, netOperatingIncome: grossRentIncome - totalExpenses, expensesByCategory,
    } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
