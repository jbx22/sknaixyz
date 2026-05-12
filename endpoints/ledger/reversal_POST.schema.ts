import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { LedgerEntries } from "../../helpers/schema";

export const schema = z.object({
  originalEntryId: z.number().int().positive(),
  reason: z.string().min(5),
  legalReference: z.string().min(3),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  entry: Selectable<LedgerEntries>;
  message: string;
};

export const postLedgerReversal = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/ledger/reversal`, {
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