import { z } from "zod";
import superjson from "superjson";
import { RentInvoiceStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  contractId: z.number().optional(),
  propertyId: z.number().optional(),
  tenantUserId: z.number().optional(),
  invoiceStatus: z.enum(RentInvoiceStatusArrayValues).optional(),
});
export type InputType = z.infer<typeof schema>;
export type InvoiceItem = {
  id: number; contractId: number; propertyId: number; tenantUserId: number;
  amount: number; invoiceStatus: string; dueDate: Date | null; periodStart: Date | null;
  periodEnd: Date | null; paidAmount: number; paidAt: Date | null; notes: string | null;
  createdAt: Date | null; updatedAt: Date | null;
};
export type OutputType = { invoices: InvoiceItem[]; total: number; page: number; limit: number; totalPages: number };
export const getRentInvoices = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams();
  sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.contractId) sp.append("contractId", String(params.contractId));
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  if (params.tenantUserId) sp.append("tenantUserId", String(params.tenantUserId));
  if (params.invoiceStatus) sp.append("invoiceStatus", params.invoiceStatus);
  const r = await fetch(`/_api/rent/invoices/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
