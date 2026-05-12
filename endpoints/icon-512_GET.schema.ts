import { z } from "zod";

// No input parameters needed
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// Output is raw SVG string, not JSON
export type OutputType = string;

export const getIcon512 = async (init?: RequestInit): Promise<string> => {
  const result = await fetch(`/_api/icon-512`, {
    method: "GET",
    ...init,
  });
  
  if (!result.ok) {
    throw new Error(`Failed to fetch icon: ${result.statusText}`);
  }
  
  return result.text();
};