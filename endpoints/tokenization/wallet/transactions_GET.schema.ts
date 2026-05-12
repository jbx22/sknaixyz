import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { WalletTransactions } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  transactions: Selectable<WalletTransactions>[];
  total: number;
  page: number;
  pageSize: number;
};

export const getWalletTransactions = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  // Construct query string
  const queryParams = new URLSearchParams();
  queryParams.append("page", params.page.toString());
  queryParams.append("pageSize", params.pageSize.toString());

  const result = await fetch(`/_api/tokenization/wallet/transactions?${queryParams.toString()}`, {
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