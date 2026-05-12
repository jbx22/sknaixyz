import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Properties, PropertyTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  locationName: z.string().min(3, "Location name is required"),
  latitude: z.number(),
  longitude: z.number(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  areaSqm: z.number().positive("Area must be positive"),
  propertyType: z.enum(PropertyTypeArrayValues),
  zipCode: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  property: Selectable<Properties>;
};

export const createProperty = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/properties/create`, {
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