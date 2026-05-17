import { useQuery } from "@tanstack/react-query";
import { fetchPlans } from "../endpoints/subscriptions/plans_GET.schema";
import { fetchServices } from "../endpoints/subscriptions/services_GET.schema";
import { fetchMySubscription } from "../endpoints/subscriptions/me_GET.schema";
import { checkFeatureAccess } from "../endpoints/subscriptions/check-feature_GET.schema";

export function usePlans() {
  return useQuery({ queryKey: ["subscription-plans"], queryFn: () => fetchPlans() });
}

export function useServices() {
  return useQuery({ queryKey: ["service-catalog"], queryFn: () => fetchServices() });
}

export function useMySubscription() {
  return useQuery({ queryKey: ["my-subscription"], queryFn: () => fetchMySubscription() });
}

export function useFeatureAccess(featureKey: string, enabled = true) {
  return useQuery({
    queryKey: ["feature-access", featureKey],
    queryFn: () => checkFeatureAccess(featureKey),
    enabled,
  });
}
