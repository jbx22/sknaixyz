import { z } from "zod";
import superjson from 'superjson';

// No input parameters needed for manifest
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// The output is a standard Web App Manifest JSON structure
// We define it loosely here as it's consumed by the browser, not our frontend code usually
export type OutputType = Record<string, any>;

export const getManifest = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/manifest`, {
    method: "GET",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });
  
  if (!result.ok) {
    throw new Error(`Failed to fetch manifest: ${result.statusText}`);
  }
  
  return result.json();
};