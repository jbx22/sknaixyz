import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20), propertyId: z.number().optional(), userId: z.number().optional() });
export type InputType = z.infer<typeof schema>;
export type OwnershipItem = { id: number; propertyId: number; userId: number; ownershipPercentage: number; investmentAmount: number; acquiredAt: Date | null; createdAt: Date | null; updatedAt: Date | null };
export type OutputType = { shares: OwnershipItem[]; total: number; page: number; limit: number; totalPages: number };
export const getOwnershipShares = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  if (params.userId) sp.append("userId", String(params.userId));
  const r = await fetch(`/_api/rent/ownership/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
