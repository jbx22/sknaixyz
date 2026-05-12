import { z } from "zod";
import superjson from "superjson";
import { SubscriptionTier } from "../../helpers/schema";

export const schema = z.object({});

export type SubscriptionFeatures = {
  canShare: boolean;
  canPrint: boolean;
  canExportPDF: boolean;
  canEmailReports: boolean;
  canFeatureProperties: boolean;
};

export type SubscriptionLimits = {
  propertyLimit: number; // -1 for unlimited
  aiReportLimit: number;
};

export type OutputType = {
  tier: SubscriptionTier;
  expiresAt: Date | null;
  propertiesCount: number;
  propertyLimit: number; // -1 for unlimited
  canAddMoreProperties: boolean;
  features: SubscriptionFeatures;
  aiReportLimit: number;
  aiReportsUsed: number;
  aiReportsRemaining: number;
  aiReportResetDate: Date;
};

export const getSubscriptionStatus = async (
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/subscription/status`, {
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