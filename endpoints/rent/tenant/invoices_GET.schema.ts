import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20), invoiceStatus: z.string().optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { invoices: Array<{ id: number; contractId: number; propertyId: number; amount: number; invoiceStatus: string; dueDate: Date | null; periodStart: Date | null; periodEnd: Date | null; paidAmount: number }>; total: number; page: number; limit: number; totalPages: number };
export const getTenantInvoices = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams(); sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.invoiceStatus) sp.append("invoiceStatus", params.invoiceStatus);
  const r = await fetch(`/_api/rent/tenant/invoices?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
