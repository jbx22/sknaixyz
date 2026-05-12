import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KycRecords,
} from "./schema";

// Import endpoint schemas and fetchers
import { 
  getKycStatus, 
  OutputType as KycStatusOutput 
} from "../endpoints/tokenization/kyc/status_GET.schema";
import { 
  postSubmitKyc, 
  InputType as SubmitKycInput,
  OutputType as SubmitKycOutput 
} from "../endpoints/tokenization/kyc/submit_POST.schema";

import { 
  getWalletInfo, 
  OutputType as WalletInfoOutput 
} from "../endpoints/tokenization/wallet/info_GET.schema";
import { 
  postWalletDeposit, 
  InputType as WalletDepositInput,
  OutputType as WalletDepositOutput 
} from "../endpoints/tokenization/wallet/deposit_POST.schema";
import { 
  postWalletWithdraw, 
  InputType as WalletWithdrawInput,
  OutputType as WalletWithdrawOutput 
} from "../endpoints/tokenization/wallet/withdraw_POST.schema";
import { 
  getWalletTransactions, 
  OutputType as WalletTransactionsOutput 
} from "../endpoints/tokenization/wallet/transactions_GET.schema";

import { 
  getTokenizationOfferingsList, 
  InputType as OfferingsListInput,
  OutputType as OfferingsListOutput 
} from "../endpoints/tokenization/offerings/list_GET.schema";
import { 
  getTokenizationOfferingDetails, 
  OutputType as OfferingDetailsOutput 
} from "../endpoints/tokenization/offerings/details_GET.schema";
import { 
  postTokenizationOfferingsInvest, 
  InputType as InvestInput,
  OutputType as InvestOutput 
} from "../endpoints/tokenization/offerings/invest_POST.schema";

import { 
  getTokenizationPortfolioHoldings, 
  OutputType as PortfolioHoldingsOutput 
} from "../endpoints/tokenization/portfolio/holdings_GET.schema";
import { 
  getTokenizationPortfolioIncome, 
  InputType as PortfolioIncomeInput,
  OutputType as PortfolioIncomeOutput 
} from "../endpoints/tokenization/portfolio/income_GET.schema";

import { 
  getTokenizationSecondaryListings, 
  InputType as SecondaryListingsInput,
  OutputType as SecondaryListingsOutput 
} from "../endpoints/tokenization/secondary/listings_GET.schema";
import { 
  postTokenizationSecondaryCreate, 
  InputType as CreateSecondaryListingInput,
  OutputType as CreateSecondaryListingOutput 
} from "../endpoints/tokenization/secondary/create_POST.schema";
import { 
  postTokenizationSecondaryBuy, 
  InputType as BuySecondaryListingInput,
  OutputType as BuySecondaryListingOutput 
} from "../endpoints/tokenization/secondary/buy_POST.schema";

import { 
  postTokenizationComplianceAcknowledge, 
  InputType as AcknowledgeRiskInput,
  OutputType as AcknowledgeRiskOutput 
} from "../endpoints/tokenization/compliance/acknowledge_POST.schema";

// --- Types ---

// Re-exporting types for convenience in components
export type KycStatusResponse = KycStatusOutput;
export type WalletResponse = WalletInfoOutput;
export type TransactionHistoryResponse = WalletTransactionsOutput;
export type TokenOfferingListResponse = OfferingsListOutput;
export type TokenOfferingDetailsResponse = OfferingDetailsOutput;
export type PortfolioResponse = PortfolioHoldingsOutput;
export type IncomeHistoryResponse = PortfolioIncomeOutput;
export type SecondaryListingsResponse = SecondaryListingsOutput;

// --- Query Keys ---

export const TOKENIZATION_KEYS = {
  kyc: ["tokenization", "kyc"] as const,
  wallet: ["tokenization", "wallet"] as const,
  transactions: (page: number, pageSize: number) =>
    ["tokenization", "transactions", page, pageSize] as const,
  offerings: (params: Partial<OfferingsListInput> = {}) => ["tokenization", "offerings", params] as const,
  offering: (id: number) => ["tokenization", "offering", id] as const,
  portfolio: ["tokenization", "portfolio"] as const,
  income: (page: number, pageSize: number) => ["tokenization", "income", page, pageSize] as const,
  secondaryListings: (assetId?: number, page?: number, pageSize?: number) =>
    ["tokenization", "secondary", assetId, page, pageSize] as const,
};

// --- Hooks ---

// 1. KYC Hooks

export function useKYCStatus() {
  return useQuery({
    queryKey: TOKENIZATION_KEYS.kyc,
    queryFn: () => getKycStatus(),
  });
}

export function useSubmitKYC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitKycInput) => postSubmitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.kyc });
    },
  });
}

// 2. Wallet Hooks

export function useWallet() {
  return useQuery({
    queryKey: TOKENIZATION_KEYS.wallet,
    queryFn: () => getWalletInfo(),
  });
}

export function useWalletDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WalletDepositInput) => postWalletDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.wallet });
      queryClient.invalidateQueries({
        queryKey: ["tokenization", "transactions"],
      });
    },
  });
}

export function useWalletWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WalletWithdrawInput) => postWalletWithdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.wallet });
      queryClient.invalidateQueries({
        queryKey: ["tokenization", "transactions"],
      });
    },
  });
}

export function useWalletTransactions(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: TOKENIZATION_KEYS.transactions(page, pageSize),
    queryFn: () =>
      getWalletTransactions({ page, pageSize }),
  });
}

// 3. Offering Hooks

export function useTokenOfferings(params: Partial<OfferingsListInput> = {}) {
  // Default values are handled in the schema or endpoint, but we pass what's provided
  return useQuery({
    queryKey: TOKENIZATION_KEYS.offerings(params),
    queryFn: () => getTokenizationOfferingsList({
      page: params.page || 1,
      pageSize: params.pageSize || 12,
      status: params.status || 'open'
    }),
  });
}

export function useTokenOfferingDetails(assetId: number) {
  return useQuery({
    queryKey: TOKENIZATION_KEYS.offering(assetId),
    queryFn: () => getTokenizationOfferingDetails({ assetId }),
    enabled: !!assetId,
  });
}

export function useInvestInOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvestInput) => postTokenizationOfferingsInvest(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.portfolio });
      queryClient.invalidateQueries({
        queryKey: TOKENIZATION_KEYS.offering(variables.assetId),
      });
      // Invalidate all offerings lists as availability changed
      queryClient.invalidateQueries({ queryKey: ["tokenization", "offerings"] });
    },
  });
}

// 4. Portfolio Hooks

export function usePortfolio() {
  return useQuery({
    queryKey: TOKENIZATION_KEYS.portfolio,
    queryFn: () => getTokenizationPortfolioHoldings(),
  });
}

export function useIncomeHistory(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: TOKENIZATION_KEYS.income(page, pageSize),
    queryFn: () => getTokenizationPortfolioIncome({ page, pageSize }),
  });
}

// 5. Secondary Market Hooks

export function useSecondaryListings(assetId?: number, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: TOKENIZATION_KEYS.secondaryListings(assetId, page, pageSize),
    queryFn: () =>
      getTokenizationSecondaryListings({
        assetId,
        page,
        pageSize
      }),
  });
}

export function useCreateSecondaryListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSecondaryListingInput) =>
      postTokenizationSecondaryCreate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tokenization", "secondary"], // Invalidate all secondary listings
      });
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.portfolio });
    },
  });
}

export function useBuySecondaryListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BuySecondaryListingInput) =>
      postTokenizationSecondaryBuy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tokenization", "secondary"], // Invalidate all secondary listings
      });
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: TOKENIZATION_KEYS.portfolio });
    },
  });
}

// 6. Risk & Compliance Hooks

export function useAcknowledgeRisk() {
  return useMutation({
    mutationFn: (data: AcknowledgeRiskInput) =>
      postTokenizationComplianceAcknowledge(data),
  });
}