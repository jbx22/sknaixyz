import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues, SubscriptionTierArrayValues, UserStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  userId: z.number(),
  role: z.enum(UserRoleArrayValues).optional(),
  subscriptionTier: z.enum(SubscriptionTierArrayValues).optional(),
  status: z.enum(UserStatusArrayValues).optional(),
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  user: {
    id: number;
    email: string;
    displayName: string;
        role: "admin" | "user" | "superadmin";
    subscriptionTier: "free" | "basic" | "premium";
    status: "active" | "suspended" | "deactivated";
  };
};

export const updateAdminUser = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/users/update`, {
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