import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { TokenizedAssets, OfferingStatusArrayValues } from '../../../../helpers/schema';

export const schema = z.object({
  assetId: z.number(),
  offeringStatus: z.enum(OfferingStatusArrayValues).optional(),
  tokenPrice: z.number().positive().optional(),
  annualRentalYield: z.number().optional(),
  incomeRights: z.boolean().optional(),
  votingRights: z.boolean().optional(),
  lockUpDays: z.number().int().min(0).optional(),
  transferable: z.boolean().optional(),
  titleDeedUrl: z.string().url().optional(),
  valuationReportUrl: z.string().url().optional()
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  offering: Selectable<TokenizedAssets>;
};

export const updateAdminOffering = async (
body: InputType,
init?: RequestInit)
: Promise<OutputType> => {
  const result = await fetch(`/_api/admin/tokenization/offerings/update`, {
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