import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ propertyId: z.number(), periodStart: z.string(), periodEnd: z.string() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { propertyId: number; periodStart: string; periodEnd: string; grossRentIncome: number; totalExpenses: number; netOperatingIncome: number; expensesByCategory: Record<string, number> };
export const getPropertyIncomeReport = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("propertyId", String(params.propertyId)); sp.append("periodStart", params.periodStart); sp.append("periodEnd", params.periodEnd);
  const r = await fetch(`/_api/rent/reports/property-income?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
