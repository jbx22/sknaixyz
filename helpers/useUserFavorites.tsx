import { usePropertiesQuery } from "./usePropertiesQuery";
import { useAuth } from "./useAuth";

export function useUserFavorites() {
  const { authState } = useAuth();
  
  // Only fetch if authenticated
  const isEnabled = authState.type === "authenticated";

  const { data, isLoading, error, refetch } = usePropertiesQuery({
    page: 1,
    pageSize: 20,
    favoritesOnly: true,
  });

  return {
    favorites: data?.properties || [],
    isLoading: isLoading && isEnabled, // Only show loading if we are actually trying to fetch
    error,
    refetch,
  };
}