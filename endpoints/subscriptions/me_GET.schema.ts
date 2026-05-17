import { z } from "zod";
import superjson from "superjson";

const schema = z.object({});

export type SubscriptionInfo = {
  id: number; userId: number; planTier: string; status: string;
  currentPeriodStart: string; currentPeriodEnd: string | null;
  trialEndsAt: string | null; cancelledAt: string | null;
};
export type UserFeature = {
  featureKey: string; isIncluded: boolean; usageLimit: number | null;
  displayValue: string | null; category: string; nameEn: string; nameAr: string;
};
export type OutputType = { subscription: SubscriptionInfo; features: UserFeature[] };

const API_BASE = "/_api";
export const fetchMySubscription = async (init?: RequestInit): Promise<OutputType> => {
  const res = await fetch(`${API_BASE}/subscriptions/me`, { method: "GET", headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) { const e = superjson.parse<{ error: string }>(await res.text()); throw new Error(e.error); }
  return superjson.parse<OutputType>(await res.text());
};
