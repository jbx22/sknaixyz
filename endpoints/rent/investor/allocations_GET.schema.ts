import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20) });
export type InputType = z.infer<typeof schema>;
export type OutputType = { allocations: Array<{ id: number; propertyId: number; periodStart: Date | null; periodEnd: Date | null; totalIncome: number; totalExpenses: number; netIncome: number; allocatedAmount: number; allocationStatus: string }>; total: number; page: number; limit: number };
export const getInvestorAllocations = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  const r = await fetch(`/_api/rent/investor/allocations?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
