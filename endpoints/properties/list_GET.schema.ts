import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Properties, PropertyTypeArrayValues, AiReportStatus } from "../../helpers/schema";

export const schema = z.object({
  search: z.string().optional(),
  propertyType: z.enum(PropertyTypeArrayValues).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minBedrooms: z.number().optional(),
  userId: z.number().optional(),
  favoritesOnly: z.boolean().optional(),
  zipCode: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type InputType = z.infer<typeof schema>;

export type PropertyWithDetails = Selectable<Properties> & {
  ownerName: string;
  ownerAvatarUrl: string | null;
  isFavorited: boolean;
  aiReportStatus: AiReportStatus | null;
  aiReportGeneratedAt: Date | null;
};

export type OutputType = {
  properties: PropertyWithDetails[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
};

export const getProperties = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  // Convert params to URLSearchParams
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.append("search", params.search);
  if (params.propertyType) searchParams.append("propertyType", params.propertyType);
  if (params.minPrice !== undefined) searchParams.append("minPrice", params.minPrice.toString());
  if (params.maxPrice !== undefined) searchParams.append("maxPrice", params.maxPrice.toString());
  if (params.minBedrooms !== undefined) searchParams.append("minBedrooms", params.minBedrooms.toString());
  if (params.userId !== undefined) searchParams.append("userId", params.userId.toString());
  if (params.favoritesOnly) searchParams.append("favoritesOnly", "true");
  if (params.zipCode) searchParams.append("zipCode", params.zipCode);
  if (params.page !== undefined) searchParams.append("page", params.page.toString());
  if (params.pageSize !== undefined) searchParams.append("pageSize", params.pageSize.toString());

  const result = await fetch(`/_api/properties/list?${searchParams.toString()}`, {
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