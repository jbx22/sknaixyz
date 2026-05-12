import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  totalTokenizedAssets: number;
  totalTokensSold: number;
  totalValueLocked: number;
  totalInvestors: number;
  pendingKycCount: number;
  approvedKycCount: number;
  totalWalletBalance: number;
  totalIncomeDistributed: number;
  activeSecondaryListings: number;
};

export const getAdminTokenizationStats = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/tokenization/stats`, {
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