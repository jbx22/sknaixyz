import { z } from "zod";
import superjson from "superjson";
import { Json } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  entityType: z.string().optional(),
  action: z.string().optional(),
  userId: z.number().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type InputType = z.infer<typeof schema>;

export type ComplianceLogItem = {
  id: number;
  userId: number | null;
  userEmail: string | null;
  userDisplayName: string | null;
  entityType: string;
  entityId: number | null;
  action: string;
  details: Json | null;
  ipAddress: string | null;
  createdAt: Date;
};

export type OutputType = {
  logs: ComplianceLogItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const getAdminComplianceLogs = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("pageSize", params.pageSize.toString());
  if (params.entityType) searchParams.append("entityType", params.entityType);
  if (params.action) searchParams.append("action", params.action);
  if (params.userId) searchParams.append("userId", params.userId.toString());
  if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom.toISOString());
  if (params.dateTo) searchParams.append("dateTo", params.dateTo.toISOString());

  const result = await fetch(`/_api/admin/compliance/logs?${searchParams.toString()}`, {
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