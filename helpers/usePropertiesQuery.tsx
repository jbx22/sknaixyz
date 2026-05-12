import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getProperties, InputType, OutputType } from "../endpoints/properties/list_GET.schema";
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
    queryFn: () => getProperties(queryFilters),
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