import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ allocationId: z.number(), notes: z.string().optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; distributionsCreated: number };
export const createRentDistribution = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/distributions/create", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
