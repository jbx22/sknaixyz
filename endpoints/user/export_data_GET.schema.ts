import { z } from "zod";
import superjson from 'superjson';
import type { UserExportData } from "../../helpers/UserExportDataType";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  data: UserExportData;
};

export const getUserExportData = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/user/export_data`, {
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