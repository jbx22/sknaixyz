import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { SmartContractRules } from "../../helpers/schema";

export const schema = z.object({
  assetId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  rules: Selectable<SmartContractRules> | null;
};

export const getContractRulesEndpoint = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("assetId", params.assetId.toString());

  const result = await fetch(`/_api/ledger/contract-rules?${searchParams.toString()}`, {
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