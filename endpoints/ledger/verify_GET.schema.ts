import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  limit: z.number().min(1).max(10000).default(1000),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  valid: boolean;
  totalEntries?: number;
  invalidAtSequence?: number;
  details: string;
};

export const getLedgerVerify = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("limit", params.limit.toString());

  const result = await fetch(`/_api/ledger/verify?${searchParams.toString()}`, {
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