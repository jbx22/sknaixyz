import { z } from "zod";
import { User } from "../../helpers/User";
import {
  isEmailDomainValid,
  EMAIL_DOMAIN_ERROR_MESSAGE,
} from "../../helpers/emailDomainValidator";

export const schema = z.object({
  email: z
    .string()
    .email("Email is required")
    .refine(isEmailDomainValid, {
      message: EMAIL_DOMAIN_ERROR_MESSAGE,
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  displayName: z.string().min(1, "Name is required"),
});

export type OutputType = {
  user: User;
};

export const postRegister = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/register_with_password`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include", // Important for cookies to be sent and received
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.message || "Registration failed");
  }

  return result.json();
};
