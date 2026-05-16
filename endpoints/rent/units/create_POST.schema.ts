import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  propertyId: z.number(),
  unitNumber: z.string().min(1),
  floorNumber: z.number().optional(),
  areaSqm: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  monthlyRent: z.number().min(0).optional(),
  description: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; unit: { id: number } };

export const createRentUnit = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/units/create", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
