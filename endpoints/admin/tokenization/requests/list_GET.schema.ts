import { z } from "zod";
import superjson from "superjson";
import { TokenizationRequestStatus, TokenizationRequestStatusArrayValues } from "../../../../helpers/schema";

export const schema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status: z.enum(TokenizationRequestStatusArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type AdminTokenizationRequestItem = {
  id: number;
  userId: number;
  propertyId: number;
  estimatedValue: string | null;
  desiredTokenPrice: string | null;
  notes: string | null;
  status: TokenizationRequestStatus;
  rejectionReason: string | null;
  adminNotes: string | null;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  propertyTitle: string;
  propertyLocation: string;
  ownerName: string;
  ownerEmail: string;
};

export type OutputType = {
  requests: AdminTokenizationRequestItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const getAdminTokenizationRequestsList = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("pageSize", params.pageSize.toString());
  if (params.status) searchParams.append("status", params.status);

  const result = await fetch(`/_api/admin/tokenization/requests/list?${searchParams.toString()}`, {
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