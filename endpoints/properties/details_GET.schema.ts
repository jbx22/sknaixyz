import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Properties } from "../../helpers/schema";

export const schema = z.object({
  id: z.number(),
});

export type InputType = z.infer<typeof schema>;

export type PropertyDetails = Selectable<Properties> & {
  ownerName: string;
  ownerAvatarUrl: string | null;
  ownerEmail: string;
  isFavorited: boolean;
};

export type OutputType = {
  property: PropertyDetails;
};

export const getPropertyDetails = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("id", params.id.toString());

  const result = await fetch(`/_api/properties/details?${searchParams.toString()}`, {
    method: "GET",
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