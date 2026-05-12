import { z } from "zod";
import superjson from "superjson";
import { PropertyStatusArrayValues, PropertyTypeArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  userId: z.number().optional(),
  status: z.enum(PropertyStatusArrayValues).optional(),
  propertyType: z.enum(PropertyTypeArrayValues).optional(),
  isFeatured: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type AdminPropertyListItem = {
  id: number;
  title: string;
  price: string | number; // Numeric type from DB comes as string usually
  locationName: string;
  status: "available" | "rented" | "sold";
  propertyType: "apartment" | "commercial" | "land" | "townhouse" | "villa";
  isFeatured: boolean;
  createdAt: Date | null;
  userId: number;
  ownerName: string;
  ownerEmail: string;
  favoritesCount: number;
  chatsCount: number;
};

export type OutputType = {
  properties: AdminPropertyListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const getAdminProperties = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());
  if (params.search) searchParams.append("search", params.search);
  if (params.userId) searchParams.append("userId", params.userId.toString());
  if (params.status) searchParams.append("status", params.status);
  if (params.propertyType) searchParams.append("propertyType", params.propertyType);
  if (params.isFeatured !== undefined) searchParams.append("isFeatured", params.isFeatured.toString());

  const result = await fetch(`/_api/admin/properties/list?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};