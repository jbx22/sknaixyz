import { z } from "zod";
import superjson from "superjson";

const schema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  propertyId: z.number().optional(),
  minRent: z.number().optional(),
  maxRent: z.number().optional(),
  minBedrooms: z.number().int().optional(),
  search: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  units: {
    id: number;
    propertyId: number;
    unitNumber: string;
    floorNumber: number | null;
    areaSqm: string | null;
    bedrooms: number | null;
    bathrooms: string | null;
    monthlyRent: string;
    status: string;
    description: string | null;
    propertyTitle?: string;
    propertyCity?: string;
  }[];
  total: number;
  page: number;
  limit: number;
};

const API_BASE = "/_api/rent";

export const getAvailableUnits = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("limit", String(params.limit ?? 20));
  if (params.propertyId) sp.set("propertyId", String(params.propertyId));
  if (params.minRent) sp.set("minRent", String(params.minRent));
  if (params.maxRent) sp.set("maxRent", String(params.maxRent));
  if (params.minBedrooms) sp.set("minBedrooms", String(params.minBedrooms));
  if (params.search) sp.set("search", params.search);
  const res = await fetch(`${API_BASE}/public/units?${sp}`, init);
  const json = await res.json();
  return superjson.parse(json) as OutputType;
};
