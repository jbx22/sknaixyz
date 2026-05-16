import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20), investorUserId: z.number().optional(), distributionStatus: z.string().optional() });
export type InputType = z.infer<typeof schema>;
export type DistributionItem = { id: number; allocationId: number; investorUserId: number; propertyId: number; amount: number; distributionStatus: string; distributionDate: Date | null; transactionReference: string | null; notes: string | null; createdAt: Date | null };
export type OutputType = { distributions: DistributionItem[]; total: number; page: number; limit: number; totalPages: number };
export const getRentDistributions = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.investorUserId) sp.append("investorUserId", String(params.investorUserId));
  if (params.distributionStatus) sp.append("distributionStatus", params.distributionStatus);
  const r = await fetch(`/_api/rent/distributions/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
