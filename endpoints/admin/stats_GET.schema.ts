import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({});

export type OutputType = {
  totalUsers: number;
  totalProperties: number;
  subscriptionsByTier: {
    tier: string;
    count: number;
  }[];
  recentActivity: {
    id: number;
    action: string;
    adminName: string;
    createdAt: Date | null;
  }[];
  totalRevenue: number;
};

export const getAdminStats = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/stats`, {
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