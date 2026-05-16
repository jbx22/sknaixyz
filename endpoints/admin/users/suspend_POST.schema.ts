import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  userId: z.number(),
  reason: z.string().min(1),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
};

const API_BASE = "/_api";

export const suspendUser = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`${API_BASE}/admin/users/suspend`, {
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
