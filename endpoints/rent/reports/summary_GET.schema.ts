import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ propertyId: z.number().optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { totalDue: number; totalCollected: number; totalOverdue: number; collectionRate: number; activeContracts: number; totalUnits: number; occupiedUnits: number; occupancyRate: number };
export const getRentSummary = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams();
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  const r = await fetch(`/_api/rent/reports/summary?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
