import { z } from "zod";
import superjson from "superjson";

export type ServiceItem = {
  id: number; serviceKey: string; nameEn: string; nameAr: string;
  descriptionEn: string; descriptionAr: string; priceSar: string;
  pricingModel: string; category: string; isActive: boolean;
  isBetaFree: boolean; betaBadge: string | null;
};
export type OutputType = { services: ServiceItem[] };

const API_BASE = "/_api";
export const fetchServices = async (init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/subscriptions/services`, { method: "GET", headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) { const e = superjson.parse<{ error: string }>(await res.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await res.text());
};
