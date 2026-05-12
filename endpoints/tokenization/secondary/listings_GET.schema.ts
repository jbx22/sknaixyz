import { z } from "zod";
import superjson from "superjson";
import { SecondaryListingStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  assetId: z.number().int().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type InputType = z.infer<typeof schema>;

export type SecondaryListingItem = {
  id: number;
  tokenizedAssetId: number;
  propertyTitle: string;
  sellerName: string;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  pricePerToken: string;
  status: typeof SecondaryListingStatusArrayValues[number];
  expiresAt: Date | null;
  createdAt: Date;
};

export type OutputType = {
  listings: SecondaryListingItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const getTokenizationSecondaryListings = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params.assetId) searchParams.append("assetId", params.assetId.toString());
  searchParams.append("page", params.page.toString());
  searchParams.append("pageSize", params.pageSize.toString());

  const result = await fetch(`/_api/tokenization/secondary/listings?${searchParams.toString()}`, {
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