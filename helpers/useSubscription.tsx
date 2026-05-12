import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptionStatus,
  OutputType as SubscriptionStatus,
} from "../endpoints/subscription/status_GET.schema";
import {
  postUpgradeSubscription,
  InputType as UpgradeInput,
  OutputType as UpgradeOutput,
} from "../endpoints/subscription/upgrade_POST.schema";
import { useAuth } from "./useAuth";

export const SUBSCRIPTION_QUERY_KEY = ["subscription", "status"] as const;

export function useSubscription() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = authState.type === "authenticated";

  const statusQuery = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: () => getSubscriptionStatus(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const upgradeMutation = useMutation({
    mutationFn: (data: UpgradeInput) => postUpgradeSubscription(data),
    onSuccess: () => {
      // Invalidate subscription status to fetch new limits/features
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      // Invalidate auth session because the user object in session has the tier
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    upgrade: upgradeMutation.mutateAsync,
    isUpgrading: upgradeMutation.isPending,
    upgradeError: upgradeMutation.error,
  };
}