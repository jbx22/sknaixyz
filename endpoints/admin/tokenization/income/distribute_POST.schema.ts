import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { IncomeDistributions } from '../../../../helpers/schema';

export const schema = z.object({
  assetId: z.number(),
  totalAmount: z.number().positive(),
  periodStart: z.date(),
  periodEnd: z.date(),
  description: z.string().optional()
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  distribution: Selectable<IncomeDistributions>;
  recipientCount: number;
  totalDistributed: number;
};

export const distributeAdminIncome = async (
body: InputType,
init?: RequestInit)
: Promise<OutputType> => {
  const result = await fetch(`/_api/admin/tokenization/income/distribute`, {
    method: "POST",
    body: superjson.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{error: string;}>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};