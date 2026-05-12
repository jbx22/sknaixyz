import { z } from "zod";
import superjson from "superjson";
import { OfferingStatusArrayValues, PropertyType } from "../../../helpers/schema";

export const schema = z.object({
  status: z.enum(OfferingStatusArrayValues).optional().default("open"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(12),
});

export type InputType = z.infer<typeof schema>;

export type OfferingListItem = {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  propertyImages: string[] | null;
  propertyType: PropertyType;
  spvName: string;
  spvId: number;
  totalValue: string; // Numeric is string in JSON
  tokenPrice: string;
  totalTokens: number;
  tokensSold: number;
  availableTokens: number;
  annualRentalYield: string | null;
  incomeRights: boolean;
  votingRights: boolean;
  lockUpDays: number;
  transferable: boolean;
  offeringStatus: typeof OfferingStatusArrayValues[number];
  createdAt: Date;
};

export type OutputType = {
  offerings: OfferingListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const getTokenizationOfferingsList = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append("status", params.status);
  searchParams.append("page", params.page.toString());
  searchParams.append("pageSize", params.pageSize.toString());

  const result = await fetch(`/_api/tokenization/offerings/list?${searchParams.toString()}`, {
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