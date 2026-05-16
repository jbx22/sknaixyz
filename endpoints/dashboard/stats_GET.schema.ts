import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  role: string;
  stats: Record<string, any>;
};

const API_BASE = "/_api";

export const getDashboardStats = async (
  _params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`${API_BASE}/dashboard/stats`, {
    method: "GET",
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
