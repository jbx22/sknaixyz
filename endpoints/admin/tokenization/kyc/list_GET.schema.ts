import { z } from "zod";
import superjson from "superjson";
import { KycStatusArrayValues, InvestorSuitabilityArrayValues, KycStatus, InvestorSuitability } from '../../../../helpers/schema';

export const schema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z.enum(KycStatusArrayValues).optional(),
  search: z.string().optional()
});

export type InputType = z.infer<typeof schema>;

export type KycRecordListItem = {
  id: number;
  userId: number;
  userDisplayName: string;
  userEmail: string;
  nationalId: string | null;
  fullNameAr: string | null;
  fullNameEn: string | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  address: string | null;
  phone: string | null;
  status: KycStatus;
  suitability: InvestorSuitability;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt: Date | null;
};

export type OutputType = {
  records: KycRecordListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const getAdminKycList = async (
params: InputType,
init?: RequestInit)
: Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("pageSize", params.pageSize.toString());
  if (params.status) searchParams.append("status", params.status);
  if (params.search) searchParams.append("search", params.search);

  const result = await fetch(`/_api/admin/tokenization/kyc/list?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{error: string;}>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};