import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTokenizationRequestsList,
  InputType as ListInput,
} from "../endpoints/tokenization/request/list_GET.schema";
import {
  postSubmitTokenizationRequest,
  InputType as SubmitInput,
} from "../endpoints/tokenization/request/submit_POST.schema";
import {
  getAdminTokenizationRequestsList,
  InputType as AdminListInput,
} from "../endpoints/admin/tokenization/requests/list_GET.schema";
import {
  postReviewTokenizationRequest,
  InputType as ReviewInput,
} from "../endpoints/admin/tokenization/requests/review_POST.schema";

export const TOKENIZATION_REQUEST_KEYS = {
  all: ["tokenization-requests"] as const,
  list: (params: ListInput) => [...TOKENIZATION_REQUEST_KEYS.all, "list", params] as const,
  admin: {
    all: ["admin", "tokenization-requests"] as const,
    list: (params: AdminListInput) => ["admin", "tokenization-requests", "list", params] as const,
  },
};

// --- User Hooks ---

export function useMyTokenizationRequests(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: TOKENIZATION_REQUEST_KEYS.list({ page, pageSize }),
    queryFn: () => getTokenizationRequestsList({ page, pageSize }),
  });
}

export function useSubmitTokenizationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitInput) => postSubmitTokenizationRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_REQUEST_KEYS.all });
    },
  });
}

// Helper to check if a specific property has an active request
// This is a bit of a workaround since we don't have a specific endpoint for this,
// but we can filter the list if the user doesn't have too many requests.
// Alternatively, we could add a specific endpoint, but for now we'll rely on the list.
// Note: This hook might be inefficient if a user has thousands of requests, but that's unlikely.
export function usePropertyTokenizationRequest(propertyId: number) {
  const { data, isLoading } = useMyTokenizationRequests(1, 100); // Fetch first 100
  
  const request = data?.requests.find(r => r.propertyId === propertyId);
  
  return {
    request,
    isLoading,
    hasActiveRequest: request && (request.status === 'pending' || request.status === 'under_review'),
    hasApprovedRequest: request && request.status === 'approved',
  };
}

// --- Admin Hooks ---

export function useAdminTokenizationRequests(params: AdminListInput) {
  return useQuery({
    queryKey: TOKENIZATION_REQUEST_KEYS.admin.list(params),
    queryFn: () => getAdminTokenizationRequestsList(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useReviewTokenizationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewInput) => postReviewTokenizationRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_REQUEST_KEYS.admin.all });
    },
  });
}