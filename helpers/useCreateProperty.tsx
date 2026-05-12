import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProperty, InputType, OutputType } from "../endpoints/properties/create_POST.schema";

export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: (data) => createProperty(data),
    onSuccess: () => {
      // Invalidate property lists to show the new property
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};