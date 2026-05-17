import { z } from "zod";
import superjson from "superjson";

const schema = z.object({});

export type InputType = z.infer<typeof schema>;
export type PlanFeature = { isIncluded: boolean; usageLimit: number | null; displayValue: string | null };
export type PlanWithFeatures = {
  id: number; tier: string; nameEn: string; nameAr: string;
  descriptionEn: string; descriptionAr: string;
  monthlyPriceSar: string; annualPriceSar: string; perUnitPriceSar: string;
  maxProperties: number | null; maxUnitsPerProperty: number | null;
  sortOrder: number; launchBadge: string | null;
};
export type Feature = { featureKey: string; nameEn: string; nameAr: string; descriptionEn: string | null; descriptionAr: string | null; category: string; iconName: string | null; sortOrder: number };
export type OutputType = { plans: PlanWithFeatures[]; features: Feature[]; accessMap: Record<string, Record<string, PlanFeature>> };

const API_BASE = "/_api";
export const fetchPlans = async (_input?: InputType, init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/subscriptions/plans`, { method: "GET", headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) { const e = superjson.parse<{ error: string }>(await res.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await res.text());
};
