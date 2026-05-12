import { z } from "zod";
import superjson from "superjson";
import { InvestorSuitabilityArrayValues, KycStatus, InvestorSuitability } from '../../../../helpers/schema';

export const schema = z.object({
  kycId: z.number(),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
  suitability: z.enum(InvestorSuitabilityArrayValues).optional()
}).refine((data) => {
  if (data.action === "reject" && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when rejecting",
  path: ["rejectionReason"]
});

export type InputType = z.infer<typeof schema>;

// We return the full record structure but typed loosely to match DB return or specific fields
export type OutputType = {
  record: {
    id: number;
    userId: number;
    status: KycStatus;
    suitability: InvestorSuitability;
    rejectionReason: string | null;
    verifiedAt: Date | null;
    updatedAt: Date;
    // ... other fields are returned but these are the critical ones
    [key: string]: any;
  };
};

export const updateAdminKyc = async (
body: InputType,
init?: RequestInit)
: Promise<OutputType> => {
  const result = await fetch(`/_api/admin/tokenization/kyc/update`, {
    method: "POST",
    body: superjson.stringify(body),
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