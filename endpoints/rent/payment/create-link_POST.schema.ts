import { z } from "zod";
import superjson from "superjson";
import { PaymentProviderNameArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  invoiceId: z.number(),
  provider: z.enum(PaymentProviderNameArrayValues).optional().default("mock"),
  returnUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; paymentUrl: string; providerReference: string };
export const createPaymentLink = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/payment/create-link", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
