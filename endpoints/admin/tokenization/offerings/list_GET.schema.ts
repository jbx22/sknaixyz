import { z } from "zod";
import superjson from "superjson";
import { OfferingStatusArrayValues, OfferingStatus } from '../../../../helpers/schema';

export const schema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z.enum(OfferingStatusArrayValues).optional()
});

export type InputType = z.infer<typeof schema>;

export type AdminOfferingListItem = {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  spvName: string;
  spvId: number;
  totalValue: string; // Numeric
  tokenPrice: string; // Numeric
  totalTokens: number;
  tokensSold: number;
  availableTokens: number;
  percentSold: number | null;
  annualRentalYield: string | null; // Numeric
  incomeRights: boolean;
  votingRights: boolean;
  lockUpDays: number;
  transferable: boolean;
  offeringStatus: OfferingStatus;
  titleDeedUrl: string | null;
  valuationReportUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OutputType = {
  offerings: AdminOfferingListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const getAdminOfferingsList = async (
params: InputType,
init?: RequestInit)
: Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("page", params.page.toString());
  searchParams.append("pageSize", params.pageSize.toString());
  if (params.status) searchParams.append("status", params.status);

  const result = await fetch(`/_api/admin/tokenization/offerings/list?${searchParams.toString()}`, {
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