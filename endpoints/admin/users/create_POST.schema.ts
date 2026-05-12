import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues, SubscriptionTierArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(UserRoleArrayValues),
  subscriptionTier: z.enum(SubscriptionTierArrayValues),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  user: {
    id: number;
    email: string;
    displayName: string;
    role: string;
    subscriptionTier: string;
    createdAt: Date | null;
  };
};

export const createAdminUser = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/users/create`, {
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