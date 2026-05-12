import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminProperties } from "../endpoints/admin/properties/list_GET.schema";
import { updateAdminProperty } from "../endpoints/admin/properties/update_POST.schema";
import { deleteAdminProperty } from "../endpoints/admin/properties/delete_POST.schema";

interface UseAdminPropertiesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "available" | "rented" | "sold";
  propertyType?: "apartment" | "commercial" | "land" | "townhouse" | "villa";
  isFeatured?: boolean;
}

export const useAdminProperties = (params: UseAdminPropertiesParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 20, search, status, propertyType, isFeatured } = params;

  const query = useQuery({
    queryKey: ["admin", "properties", page, limit, search, status, propertyType, isFeatured],
    queryFn: () => getAdminProperties({ page, limit, search, status, propertyType, isFeatured }),
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return {
    ...query,
    updateProperty: updateMutation.mutate,
    deleteProperty: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};