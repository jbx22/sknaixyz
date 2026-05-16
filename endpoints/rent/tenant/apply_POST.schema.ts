import { z } from "zod";
import superjson from "superjson";

const schema = z.object({
  propertyId: z.number().int(),
  unitId: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  success: boolean;
  contractId: number;
  message: string;
};

const API_BASE = "/_api/rent";

export const applyForRent = async (
  input: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/tenant/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
    ...init,
  });
  const json = await res.json();
  return superjson.parse(json) as OutputType;
};
