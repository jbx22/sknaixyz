import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { TokenizationRequests } from "../../../helpers/schema";

export const schema = z.object({
  propertyId: z.number().int().positive(),
  estimatedValue: z.number().positive().optional(),
  desiredTokenPrice: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  request: Selectable<TokenizationRequests>;
  message: string;
};

export const postSubmitTokenizationRequest = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tokenization/request/submit`, {
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