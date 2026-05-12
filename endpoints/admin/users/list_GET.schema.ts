import { z } from "zod";
import superjson from "superjson";
import { UserRoleArrayValues, SubscriptionTierArrayValues, UserStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(UserRoleArrayValues).optional(),
  subscriptionTier: z.enum(SubscriptionTierArrayValues).optional(),
  status: z.enum(UserStatusArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type AdminUserListItem = {
  id: number;
  email: string;
  displayName: string;
    role: "admin" | "user" | "superadmin";
  subscriptionTier: "free" | "basic" | "premium";
  status: "active" | "suspended" | "deactivated";
  createdAt: Date | null;
  avatarUrl: string | null;
};

export type OutputType = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const getAdminUsers = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());
  if (params.search) searchParams.append("search", params.search);
  if (params.role) searchParams.append("role", params.role);
  if (params.subscriptionTier) searchParams.append("subscriptionTier", params.subscriptionTier);
  if (params.status) searchParams.append("status", params.status);

  const result = await fetch(`/_api/admin/users/list?${searchParams.toString()}`, {
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