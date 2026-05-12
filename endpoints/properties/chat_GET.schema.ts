import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  propertyId: z.number(),
});

export type InputType = z.infer<typeof schema>;

export type ChatMessage = {
  id: number;
  message: string;
  userId: number;
  userName: string;
  userAvatarUrl: string | null;
  createdAt: Date | null;
  canDelete: boolean;
};

export type OutputType = {
  messages: ChatMessage[];
};

export const getPropertyChat = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.append("propertyId", params.propertyId.toString());

  const result = await fetch(`/_api/properties/chat?${searchParams.toString()}`, {
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