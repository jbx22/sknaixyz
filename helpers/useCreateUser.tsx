import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdminUser, InputType } from "../endpoints/admin/users/create_POST.schema";
import { toast } from "sonner";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => createAdminUser(data),
    onSuccess: () => {
      toast.success("User created successfully");
      // Invalidate relevant queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });
};