import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminUsers } from "../endpoints/admin/users/list_GET.schema";
import { updateAdminUser } from "../endpoints/admin/users/update_POST.schema";
import { deleteAdminUser } from "../endpoints/admin/users/delete_POST.schema";

interface UseAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
    role?: "admin" | "user" | "superadmin";
  subscriptionTier?: "free" | "basic" | "premium";
  status?: "active" | "suspended" | "deactivated";
}

export const useAdminUsers = (params: UseAdminUsersParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 20, search, role, subscriptionTier, status } = params;

  const query = useQuery({
    queryKey: ["admin", "users", page, limit, search, role, subscriptionTier, status],
    queryFn: () => getAdminUsers({ page, limit, search, role, subscriptionTier, status }),
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return {
    ...query,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};