import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  invoiceId: z.number(),
  notes: z.string().optional(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean };
export const markRentInvoicePaid = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/invoices/mark-paid", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
