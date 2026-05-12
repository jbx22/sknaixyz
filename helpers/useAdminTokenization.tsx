import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminTokenizationStats } from "../endpoints/admin/tokenization/stats_GET.schema";
import {
  getAdminKycList,
  InputType as KycListInput,
} from "../endpoints/admin/tokenization/kyc/list_GET.schema";
import {
  updateAdminKyc,
  InputType as KycUpdateInput,
} from "../endpoints/admin/tokenization/kyc/update_POST.schema";
import {
  getAdminOfferingsList,
  InputType as OfferingsListInput,
} from "../endpoints/admin/tokenization/offerings/list_GET.schema";
import {
  createAdminOffering,
  InputType as CreateOfferingInput,
} from "../endpoints/admin/tokenization/offerings/create_POST.schema";
import {
  updateAdminOffering,
  InputType as UpdateOfferingInput,
} from "../endpoints/admin/tokenization/offerings/update_POST.schema";
import {
  distributeAdminIncome,
  InputType as DistributeIncomeInput,
} from "../endpoints/admin/tokenization/income/distribute_POST.schema";

export const ADMIN_TOKEN_KEYS = {
  all: ["admin", "tokenization"] as const,
  stats: () => [...ADMIN_TOKEN_KEYS.all, "stats"] as const,
  kyc: (params: KycListInput) => [...ADMIN_TOKEN_KEYS.all, "kyc", params] as const,
  offerings: (params: OfferingsListInput) =>
    [...ADMIN_TOKEN_KEYS.all, "offerings", params] as const,
  income: () => [...ADMIN_TOKEN_KEYS.all, "income"] as const,
};

export function useAdminTokenizationStats() {
  return useQuery({
    queryKey: ADMIN_TOKEN_KEYS.stats(),
    queryFn: () => getAdminTokenizationStats(),
  });
}

export function useAdminKycList(params: KycListInput) {
  return useQuery({
    queryKey: ADMIN_TOKEN_KEYS.kyc(params),
    queryFn: () => getAdminKycList(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminKycUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KycUpdateInput) => updateAdminKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOKEN_KEYS.all });
    },
  });
}

export function useAdminOfferingsList(params: OfferingsListInput) {
  return useQuery({
    queryKey: ADMIN_TOKEN_KEYS.offerings(params),
    queryFn: () => getAdminOfferingsList(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminCreateOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOfferingInput) => createAdminOffering(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOKEN_KEYS.all });
    },
  });
}

export function useAdminUpdateOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOfferingInput) => updateAdminOffering(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOKEN_KEYS.all });
    },
  });
}

export function useAdminDistributeIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DistributeIncomeInput) => distributeAdminIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOKEN_KEYS.all });
    },
  });
}