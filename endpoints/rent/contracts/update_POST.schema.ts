import { z } from "zod";
import superjson from "superjson";
import { RentContractStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  contractId: z.number(),
  contractStatus: z.enum(RentContractStatusArrayValues).optional(),
  monthlyRent: z.number().min(0).optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean };
export const updateRentContract = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const r = await fetch("/_api/rent/contracts/update", { method: "POST", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, body: superjson.stringify(params) });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
