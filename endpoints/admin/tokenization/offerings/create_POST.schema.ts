import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { TokenizedAssets, Spvs } from '../../../../helpers/schema';

export const schema = z.object({
  propertyId: z.number(),
  spvName: z.string().min(3),
  spvLegalStructure: z.string().optional(),
  spvRegistrationNumber: z.string().optional(),
  totalValue: z.number().positive(),
  tokenPrice: z.number().positive(),
  totalTokens: z.number().int().positive(),
  annualRentalYield: z.number().optional(),
  incomeRights: z.boolean().optional().default(true),
  votingRights: z.boolean().optional().default(false),
  lockUpDays: z.number().int().min(0).optional().default(180),
  transferable: z.boolean().optional().default(true)
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  offering: Selectable<TokenizedAssets>;
  spv: Selectable<Spvs>;
};

export const createAdminOffering = async (
body: InputType,
init?: RequestInit)
: Promise<OutputType> => {
  const result = await fetch(`/_api/admin/tokenization/offerings/create`, {
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