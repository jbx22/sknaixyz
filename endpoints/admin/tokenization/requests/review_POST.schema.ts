import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { TokenizationRequests } from "../../../../helpers/schema";

export const schema = z.object({
  requestId: z.number().int().positive(),
  action: z.enum(["approve", "reject", "under_review"]),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
}).refine((data) => {
  if (data.action === "reject" && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when rejecting",
  path: ["rejectionReason"],
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  request: Selectable<TokenizationRequests>;
};

export const postReviewTokenizationRequest = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/admin/tokenization/requests/review`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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