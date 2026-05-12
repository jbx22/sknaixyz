import { z } from "zod";
import superjson from "superjson";
import { OfferingStatusArrayValues, PropertyType } from "../../../helpers/schema";

export const schema = z.object({
  assetId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OfferingDetails = {
  id: number;
  propertyId: number;
  spvId: number;
  totalValue: string;
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
  titleDeedUrl: string | null;
  valuationReportUrl: string | null;
  settledAt: Date | null;

  propertyTitle: string;
  propertyDescription: string | null;
  propertyLocation: string;
  propertyImages: string[] | null;
  propertyType: PropertyType;
  bedrooms: number | null;
  bathrooms: string | null; // Numeric in DB
  areaSqm: string; // Numeric in DB
  yearBuilt: number | null;
  latitude: string; // Numeric
  longitude: string; // Numeric

  spvName: string;
  spvLegalStructure: string | null;
  spvRegistrationNumber: string | null;
  spvLegalDocuments: any; // Json
};

export type OutputType = {
  offering: OfferingDetails;
};

export const getTokenizationOfferingDetails = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("assetId", params.assetId.toString());

  const result = await fetch(`/_api/tokenization/offerings/details?${searchParams.toString()}`, {
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