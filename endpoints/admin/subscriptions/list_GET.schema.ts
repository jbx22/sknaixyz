import { z } from "zod";
import superjson from "superjson";
import { SubscriptionTierArrayValues, PaymentStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  userId: z.number().optional(),
  tier: z.enum(SubscriptionTierArrayValues).optional(),
  status: z.enum(["active", "expired"]).optional(),
});

export type InputType = z.infer<typeof schema>;

export type AdminSubscriptionListItem = {
  id: number;
  amount: string | number;
  currency: string;
  tier: "free" | "basic" | "premium";
  paymentStatus: "completed" | "failed" | "pending" | "refunded";
  paymentMethod: string | null;
  transactionId: string | null;
  startedAt: Date;
  expiresAt: Date;
  createdAt: Date | null;
  userId: number;
  userName: string;
  userEmail: string;
};

export type OutputType = {
  subscriptions: AdminSubscriptionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const getAdminSubscriptions = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());
  if (params.userId) searchParams.append("userId", params.userId.toString());
  if (params.tier) searchParams.append("tier", params.tier);
  if (params.status) searchParams.append("status", params.status);

  const result = await fetch(`/_api/admin/subscriptions/list?${searchParams.toString()}`, {
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