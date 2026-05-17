import { z } from "zod";
import superjson from "superjson";
export type OutputType = {
  plans: any[]; features: any[]; accessMap: Record<string, Record<string, any>>; services: any[]; subscriptions: any[];
};
const API_BASE = "/_api";
export const fetchAdminPricing = async (init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/admin/pricing`, { method: "GET", headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) { const e = superjson.parse<{ error: string }>(await res.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await res.text());
};
