import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ propertyId: z.number(), userId: z.number(), ownershipPercentage: z.number().min(0.01).max(100), investmentAmount: z.number().min(0).optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; share: { id: number } };
export const createOwnershipShare = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/ownership/create", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
