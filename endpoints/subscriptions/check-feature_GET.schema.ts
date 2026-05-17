import { z } from "zod";
import superjson from "superjson";

const schema = z.object({ feature: z.string() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { allowed: boolean; planTier: string; featureKey: string; usageLimit: number | null; displayValue: string | null };

const API_BASE = "/_api";
export const checkFeatureAccess = async (feature: string, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/subscriptions/check-feature?feature=${encodeURIComponent(feature)}`, { method: "GET", headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) { const e = superjson.parse<{ error: string }>(await res.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await res.text());
};
