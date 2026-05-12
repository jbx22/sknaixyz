import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { InvestorWallets, WalletTransactions } from "../../../helpers/schema";

export const schema = z.object({
  amount: z.number().min(100, "Minimum withdrawal is 100 SAR"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  wallet: Selectable<InvestorWallets>;
  transaction: Selectable<WalletTransactions>;
};

export const postWalletWithdraw = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tokenization/wallet/withdraw`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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