import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ type: z.enum(["invoices", "payments"]), propertyId: z.number().optional(), contractId: z.number().optional(), periodStart: z.string().optional(), periodEnd: z.string().optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { csv: string; filename: string };
export const exportRentCsv = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("type", params.type);
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  if (params.contractId) sp.append("contractId", String(params.contractId));
  if (params.periodStart) sp.append("periodStart", params.periodStart);
  if (params.periodEnd) sp.append("periodEnd", params.periodEnd);
  const r = await fetch(`/_api/rent/reports/export-csv?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
