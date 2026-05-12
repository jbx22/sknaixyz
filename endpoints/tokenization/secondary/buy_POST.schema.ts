import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { InvestorWallets, TokenHoldings } from "../../../helpers/schema";

export const schema = z.object({
  listingId: z.number().int().positive(),
  quantity: z.number().int().min(1),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  wallet: Selectable<InvestorWallets>;
  holding: Selectable<TokenHoldings>;
};

export const postTokenizationSecondaryBuy = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/tokenization/secondary/buy`, {
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