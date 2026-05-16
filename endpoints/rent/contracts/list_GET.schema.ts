import { z } from "zod";
import superjson from "superjson";
import { RentContractStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  propertyId: z.number().optional(),
  landlordId: z.number().optional(),
  tenantId: z.number().optional(),
  contractStatus: z.enum(RentContractStatusArrayValues).optional(),
});
export type InputType = z.infer<typeof schema>;
export type ContractItem = {
  id: number; propertyId: number; unitId: number | null; landlordUserId: number; tenantUserId: number;
  monthlyRent: number; contractStatus: string; startDate: Date | null; endDate: Date | null;
  securityDeposit: number; paymentDueDay: number; autoGenerateInvoice: boolean;
  notes: string | null; contractDocumentUrl: string | null; createdAt: Date | null; updatedAt: Date | null;
};
export type OutputType = { contracts: ContractItem[]; total: number; page: number; limit: number; totalPages: number };
export const getRentContracts = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const sp = new URLSearchParams();
  sp.append("page", String(params.page)); sp.append("limit", String(params.limit));
  if (params.propertyId) sp.append("propertyId", String(params.propertyId));
  if (params.landlordId) sp.append("landlordId", String(params.landlordId));
  if (params.tenantId) sp.append("tenantId", String(params.tenantId));
  if (params.contractStatus) sp.append("contractStatus", params.contractStatus);
  const r = await fetch(`/_api/rent/contracts/list?${sp}`, { method: "GET", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) { const e = superjson.parse<{ error: string }>(await r.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await r.text());
};
