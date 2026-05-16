import { z } from "zod";
import superjson from "superjson";

const schema = z.object({
  propertyId: z.number().int(),
  userId: z.number().int(),
  role: z.enum(["owner", "developer", "broker", "investor", "tenant"]).optional().default("owner"),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { success: boolean; membershipId: number };

const API_BASE = "/_api/rent";

export const addPropertyMember = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/members/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
    ...init,
  });
  const json = await res.json();
  return superjson.parse(json) as OutputType;
};
