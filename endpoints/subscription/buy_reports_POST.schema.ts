import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  quantity: z.number().int().min(1).max(100),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  reportsPurchased: number;
  totalCost: number;
  message: string;
};

export const postBuyReports = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/subscription/buy_reports`, {
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