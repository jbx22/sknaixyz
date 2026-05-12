import { z } from "zod";
import superjson from "superjson";
import { SubscriptionTierArrayValues, SubscriptionTier } from "../../helpers/schema";

export const schema = z.object({
  tier: z.enum(SubscriptionTierArrayValues).refine((val) => val !== "free", {
    message: "Cannot upgrade to free tier",
  }),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  tier: SubscriptionTier;
  expiresAt: Date;
  message: string;
};

export const postUpgradeSubscription = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/subscription/upgrade`, {
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