import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { SecondaryListings } from "../../../helpers/schema";

export const schema = z.object({
  assetId: z.number().int().positive(),
  quantity: z.number().int().min(1),
  pricePerToken: z.number().positive(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  listing: Selectable<SecondaryListings>;
};

export const postTokenizationSecondaryCreate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/tokenization/secondary/create`, {
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