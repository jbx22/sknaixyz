import { z } from "zod";
import superjson from "superjson";

const base = z.object({ action: z.string() });
export type InputType = z.infer<typeof base> & Record<string, any>;
export type OutputType = { success: boolean };

const API_BASE = "/_api";
export const updatePricing = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/admin/pricing`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input), ...init,
  });
  if (!res.ok) { const e = superjson.parse<{ error: string }>(await res.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await res.text());
};
