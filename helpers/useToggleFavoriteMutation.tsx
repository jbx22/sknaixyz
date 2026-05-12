import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFavorite, InputType, OutputType } from "../endpoints/properties/toggle_favorite_POST.schema";
import { PROPERTIES_QUERY_KEY } from "./usePropertiesQuery";
import { PROPERTY_DETAILS_QUERY_KEY } from "./usePropertyDetailsQuery";
import { toast } from "sonner";

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation<OutputType, Error, InputType>({
    mutationFn: (data) => toggleFavorite(data),
    onSuccess: (data, variables) => {
      // Invalidate properties list queries to refresh favorite status
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY });
      
      // Invalidate specific property details query
      queryClient.invalidateQueries({ 
        queryKey: [...PROPERTY_DETAILS_QUERY_KEY, variables.propertyId] 
      });

      if (data.isFavorited) {
        toast.success("Added to favorites");
      } else {
        toast.success("Removed from favorites");
      }
    },
    onError: (error) => {
      toast.error(`Failed to update favorite: ${error.message}`);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}