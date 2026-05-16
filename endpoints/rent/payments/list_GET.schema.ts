import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  contractId: z.number().optional(),
  tenantUserId: z.number().optional(),
  paymentStatus: z.string().optional(),
});
export type InputType = z.infer<typeof schema>;
export type PaymentItem = {
  id: number; invoiceId: number; contractId: number; tenantUserId: number; propertyId: number;
  amount: number; paymentMethod: string; paymentStatus: string; paymentDate: Date | null;
  transactionReference: string | null; notes: string | null; recordedBy: number | null;
  createdAt: Date | null; updatedAt: Date | null;
};
export type OutputType = { payments: PaymentItem[]; total: number; page: number; limit: number; totalPages: number };
export const getRentPayments = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams();
  sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.contractId) sp.append("contractId", String(params.contractId));
  if (params.tenantUserId) sp.append("tenantUserId", String(params.tenantUserId));
  if (params.paymentStatus) sp.append("paymentStatus", params.paymentStatus);
  const r = await fetch(`/_api/rent/payments/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
