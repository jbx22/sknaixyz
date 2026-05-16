import { z } from "zod";
import superjson from "superjson";
import { RentPaymentMethodArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  invoiceId: z.number(),
  contractId: z.number(),
  tenantUserId: z.number(),
  amount: z.number().min(0),
  paymentMethod: z.enum(RentPaymentMethodArrayValues),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; payment: { id: number } };
export const recordRentPayment = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/payments/record", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
