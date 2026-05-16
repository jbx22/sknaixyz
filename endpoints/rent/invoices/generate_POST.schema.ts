import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  contractId: z.number(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; invoice: { id: number } };
export const generateRentInvoice = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/invoices/generate", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
