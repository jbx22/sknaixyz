import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type PortfolioHolding = {
  holdingId: number;
  quantity: number;
  averagePurchasePrice: string;
  totalInvested: string;
  totalIncomeReceived: string;
  acquiredAt: Date;
  assetId: number;
  tokenPrice: string;
  totalTokens: number;
  annualRentalYield: string | null;
  propertyTitle: string;
  propertyLocation: string;
  propertyImages: string[] | null;
  spvName: string;
  currentValue: number;
  ownershipPercentage: number;
};

export type OutputType = {
  holdings: PortfolioHolding[];
  totalPortfolioValue: number;
  totalInvestedAll: number;
  totalIncomeAll: number;
};

export const getTokenizationPortfolioHoldings = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/tokenization/portfolio/holdings`, {
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