import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  provider: z.string(),
  payload: z.any(),
  signature: z.string().optional(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; message: string };
export const processPaymentWebhook = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/payment/webhook", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
