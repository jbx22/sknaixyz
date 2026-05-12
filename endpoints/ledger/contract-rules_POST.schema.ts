import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { SmartContractRules, InvestorSuitabilityArrayValues } from "../../helpers/schema";

export const schema = z.object({
  assetId: z.number().int().positive(),
  minInvestmentSar: z.number().positive(),
  maxInvestmentSar: z.number().positive().optional().nullable(),
  maxInvestors: z.number().int().positive().optional().nullable(),
  maxTokenSupply: z.number().int().positive(),
  requireKyc: z.boolean(),
  requireSuitabilityCheck: z.boolean(),
  allowedSuitabilities: z.array(z.enum(InvestorSuitabilityArrayValues)),
  allowedJurisdictions: z.array(z.string()),
  minHoldingPeriodDays: z.number().int().min(0),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  rules: Selectable<SmartContractRules>;
};

export const postContractRules = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/ledger/contract-rules`, {
    method: "POST",
    body: superjson.stringify(body),
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