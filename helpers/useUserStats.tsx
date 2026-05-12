import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { usePropertiesQuery } from "./usePropertiesQuery";

export interface UserStatsData {
  totalProperties: number;
  totalFavorites: number;
  availableProperties: number;
  soldProperties: number;
  rentedProperties: number;
  subscriptionTier: "free" | "basic" | "premium";
}

export function useUserStats() {
  const { authState } = useAuth();
  
  const userId = authState.type === "authenticated" ? authState.user.id : undefined;
  const subscriptionTier = authState.type === "authenticated" ? authState.user.subscriptionTier : "free";

  // Fetch user's owned properties
  const { data: ownedData, isLoading: isLoadingOwned } = usePropertiesQuery({
    userId: userId,
  });

  // Fetch user's favorites
  // Note: This might be inefficient if the user has many favorites, 
  // but we are constrained to use existing endpoints.
  const { data: favoritesData, isLoading: isLoadingFavorites } = usePropertiesQuery({
    favoritesOnly: true,
  });

  const stats: UserStatsData | null = useMemo(() => {
    if (!ownedData || !favoritesData) return null;

    const properties = ownedData.properties;
    
    return {
      totalProperties: properties.length,
      totalFavorites: favoritesData.properties.length,
      availableProperties: properties.filter(p => p.status === "available").length,
      soldProperties: properties.filter(p => p.status === "sold").length,
      rentedProperties: properties.filter(p => p.status === "rented").length,
      subscriptionTier,
    };
  }, [ownedData, favoritesData, subscriptionTier]);

  return {
    stats,
    isLoading: isLoadingOwned || isLoadingFavorites,
  };
}