import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getProperties, InputType, OutputType } from "../endpoints/properties/list_GET.schema";
import { getSeedProperties, filterSeedProperties } from "./seedProperties";
import { useDebounce } from "./useDebounce";

export const PROPERTIES_QUERY_KEY = ["properties"] as const;

export function usePropertiesQuery(filters: InputType) {
  // Debounce search input to avoid too many requests while typing
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Create a stable filter object with debounced search
  const queryFilters: InputType = {
    ...filters,
    search: debouncedSearch,
  };

  const query = useQuery<OutputType>({
    queryKey: [...PROPERTIES_QUERY_KEY, queryFilters],
    queryFn: () => {
      // Try to get properties from API first
      return getProperties(queryFilters).catch((error) => {
        console.log("API failed, falling back to seed data for development", error);
        
        // Fallback to seed data for development
        const seedProperties = getSeedProperties();
        const filteredProperties = filterSeedProperties(seedProperties, queryFilters);
        
        return {
          properties: filteredProperties,
          total: filteredProperties.length,
          page: queryFilters.page || 1,
          pageSize: queryFilters.pageSize || 20,
          totalPages: Math.ceil(filteredProperties.length / (queryFilters.pageSize || 20)),
        };
      });
    },
    // Initialize seed data if not exists
    onSuccess: (data) => {
      if (data.properties.length > 0) {
        const existingData = localStorage.getItem("sknai.seedProperties");
        if (!existingData) {
          localStorage.setItem("sknai.seedProperties", JSON.stringify(data.properties));
        }
      }
    },
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}