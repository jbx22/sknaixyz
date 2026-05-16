import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  propertyId: z.number().optional(),
  status: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  units: Array<{
    id: number;
    propertyId: number;
    unitNumber: string;
    floorNumber: number | null;
    areaSqm: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    monthlyRent: number | null;
    status: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const getRentUnits = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams();
  sp.append("page", String(params.page));
  sp.append("limit", String(params.limit));
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  if (params.status) sp.append("status", params.status);
  const r = await fetch(`/_api/rent/units/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
