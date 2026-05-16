import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20), propertyId: z.number().optional(), ownerUserId: z.number().optional(), allocationStatus: z.string().optional() });
export type InputType = z.infer<typeof schema>;
export type AllocationItem = { id: number; propertyId: number; ownerUserId: number; ownershipShareId: number | null; periodStart: Date | null; periodEnd: Date | null; totalIncome: number; totalExpenses: number; netIncome: number; allocatedAmount: number; allocationStatus: string; createdAt: Date | null };
export type OutputType = { allocations: AllocationItem[]; total: number; page: number; limit: number; totalPages: number };
export const getRentAllocations = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  if (params.ownerUserId) sp.append("ownerUserId", String(params.ownerUserId));
  if (params.allocationStatus) sp.append("allocationStatus", params.allocationStatus);
  const r = await fetch(`/_api/rent/allocations/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
