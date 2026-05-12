import { useQuery } from "@tanstack/react-query";
import { getPropertyDetails, OutputType } from "../endpoints/properties/details_GET.schema";

export const PROPERTY_DETAILS_QUERY_KEY = ["property_details"] as const;

export function usePropertyDetailsQuery(propertyId: number) {
  const query = useQuery<OutputType>({
    queryKey: [...PROPERTY_DETAILS_QUERY_KEY, propertyId],
    queryFn: () => getPropertyDetails({ id: propertyId }),
    enabled: !!propertyId,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}