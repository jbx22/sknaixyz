import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type InputType = z.infer<typeof schema>;

export type RoleAssignmentItem = {
  id: number;
  userId: number;
  assignedRole: string;
  assignedBy: number;
  scope: string | null;
  isActive: boolean;
  createdAt: Date | null;
  revokedAt: Date | null;
  userName: string;
  userEmail: string;
  assignerName: string;
};

export type OutputType = {
  assignments: RoleAssignmentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const API_BASE = "/_api";

export const getRoleAssignments = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());

  const result = await fetch(`${API_BASE}/admin/role-assignments/list?${searchParams.toString()}`, {
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
