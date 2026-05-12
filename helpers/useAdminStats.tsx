import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "../endpoints/admin/stats_GET.schema";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
    refetchInterval: 30000, // 30 seconds
  });
};