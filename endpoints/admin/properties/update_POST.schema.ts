import { z } from "zod";
import superjson from "superjson";
import { PropertyStatusArrayValues } from "../../../helpers/schema";

export const schema = z.object({
  propertyId: z.number(),
  status: z.enum(PropertyStatusArrayValues).optional(),
  isFeatured: z.boolean().optional(),
  price: z.number().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
  property: {
    id: number;
    status: "available" | "rented" | "sold";
    isFeatured: boolean;
    price: string | number;
  };
};

export const updateAdminProperty = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/admin/properties/update`, {
    method: "POST",
    body: superjson.stringify(body),
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