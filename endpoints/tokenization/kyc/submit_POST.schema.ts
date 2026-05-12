import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { KycRecords } from "../../../helpers/schema";

export const schema = z.object({
  nationalId: z.string().min(1, "National ID is required"),
  fullNameAr: z.string().min(1, "Arabic name is required"),
  fullNameEn: z.string().min(1, "English name is required"),
  dateOfBirth: z.date({ coerce: true }),
  nationality: z.string().min(1, "Nationality is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  kyc: Selectable<KycRecords>;
  message: string;
};

export const postSubmitKyc = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tokenization/kyc/submit`, {
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