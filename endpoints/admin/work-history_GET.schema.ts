import { z } from "zod";
import superjson from "superjson";
import { Json } from "../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  adminId: z.number().optional(),
  actionType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type WorkHistoryItem = {
  id: number;
  actionType: string;
  targetType: string | null;
  targetId: number | null;
  targetUserId: number | null;
  details: Json | null;
  outcome: string | null;
  ipAddress: string | null;
  createdAt: Date | null;
  adminName: string;
  adminEmail: string;
};

export type OutputType = {
  logs: WorkHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const API_BASE = "/_api";

export const getAdminWorkHistory = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());
  if (params.adminId) searchParams.append("adminId", params.adminId.toString());
  if (params.actionType) searchParams.append("actionType", params.actionType);
  if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.append("dateTo", params.dateTo);

  const result = await fetch(`${API_BASE}/admin/work-history?${searchParams.toString()}`, {
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
