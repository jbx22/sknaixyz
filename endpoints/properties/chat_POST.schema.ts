import { z } from "zod";
import superjson from "superjson";
import { ChatMessage } from "./chat_GET.schema";

export const schema = z.object({
  propertyId: z.number(),
  message: z.string().min(1, "الرسالة لا يمكن أن تكون فارغة").max(1000, "الرسالة طويلة جداً"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  message: ChatMessage;
};

export const postPropertyChat = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/properties/chat`, {
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