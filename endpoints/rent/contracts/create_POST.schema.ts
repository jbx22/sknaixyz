import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  propertyId: z.number(),
  unitId: z.number().optional(),
  landlordUserId: z.number(),
  tenantUserId: z.number(),
  monthlyRent: z.number().min(0),
  startDate: z.string(),
  endDate: z.string(),
  securityDeposit: z.number().min(0).optional(),
  paymentDueDay: z.number().min(1).max(28).optional(),
  autoGenerateInvoice: z.boolean().optional(),
  notes: z.string().optional(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; contract: { id: number } };
export const createRentContract = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/contracts/create", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
