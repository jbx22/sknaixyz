import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type InputType = z.infer<typeof schema>;

export type IncomeDistributionItem = {
  id: number;
  propertyTitle: string;
  totalAmount: string;
  amountPerToken: string;
  userAmount: string;
  distributionDate: Date;
  periodStart: Date;
  periodEnd: Date;
  description: string | null;
};

export type OutputType = {
  distributions: IncomeDistributionItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const getTokenizationPortfolioIncome = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("pageSize", params.pageSize.toString());

  const result = await fetch(`/_api/tokenization/portfolio/income?${searchParams.toString()}`, {
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