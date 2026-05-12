import { z } from "zod";
import superjson from "superjson";
import { Json } from "../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  adminId: z.number().optional(),
  actionType: z.string().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
});

export type InputType = z.infer<typeof schema>;

export type AdminActivityLogItem = {
  id: number;
  actionType: string;
  targetType: string | null;
  targetId: number | null;
  details: Json | null;
  ipAddress: string | null;
  createdAt: Date | null;
  adminName: string;
  adminEmail: string;
};

export type OutputType = {
  logs: AdminActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const getAdminActivityLogs = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("limit", params.limit.toString());
  if (params.adminId) searchParams.append("adminId", params.adminId.toString());
  if (params.actionType) searchParams.append("actionType", params.actionType);
  if (params.fromDate) searchParams.append("fromDate", params.fromDate.toISOString());
  if (params.toDate) searchParams.append("toDate", params.toDate.toISOString());

  const result = await fetch(`/_api/admin/activity_logs?${searchParams.toString()}`, {
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