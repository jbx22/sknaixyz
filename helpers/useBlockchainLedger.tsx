import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLedgerEntriesEndpoint,
  InputType as LedgerEntriesInput,
} from "../endpoints/ledger/entries_GET.schema";
import {
  getLedgerVerify,
  InputType as LedgerVerifyInput,
} from "../endpoints/ledger/verify_GET.schema";
import {
  postLedgerReversal,
  InputType as LedgerReversalInput,
} from "../endpoints/ledger/reversal_POST.schema";
import {
  postEmergencyFreeze,
  InputType as EmergencyFreezeInput,
} from "../endpoints/ledger/emergency/freeze_POST.schema";
import {
  getContractRulesEndpoint,
} from "../endpoints/ledger/contract-rules_GET.schema";
import {
  postContractRules,
  InputType as ContractRulesInput,
} from "../endpoints/ledger/contract-rules_POST.schema";
import {
  getGlobalControlsEndpoint,
} from "../endpoints/ledger/global-controls_GET.schema";
import {
  getAssetControlsEndpoint,
} from "../endpoints/ledger/asset-controls_GET.schema";

export const LEDGER_KEYS = {
  all: ["ledger"] as const,
  entries: (filters: LedgerEntriesInput) => [...LEDGER_KEYS.all, "entries", filters] as const,
  verify: (options?: LedgerVerifyInput) => [...LEDGER_KEYS.all, "verify", options] as const,
  contractRules: (assetId: number) => [...LEDGER_KEYS.all, "contractRules", assetId] as const,
  globalControls: () => [...LEDGER_KEYS.all, "controls", "global"] as const,
  assetControls: (assetId: number) => [...LEDGER_KEYS.all, "controls", "asset", assetId] as const,
};

// 1. Ledger Entries
export function useLedgerEntries(filters: LedgerEntriesInput) {
  return useQuery({
    queryKey: LEDGER_KEYS.entries(filters),
    queryFn: () => getLedgerEntriesEndpoint(filters),
    placeholderData: (previousData) => previousData,
  });
}

// 2. Ledger Verification
export function useLedgerVerify(options: LedgerVerifyInput = { limit: 1000 }, enabled = false) {
  return useQuery({
    queryKey: LEDGER_KEYS.verify(options),
    queryFn: () => getLedgerVerify(options),
    enabled: enabled,
  });
}

// 3. Reversal
export function useReverseLedgerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LedgerReversalInput) => postLedgerReversal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEDGER_KEYS.all });
    },
  });
}

// 4. Emergency Controls
export function useEmergencyFreeze() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmergencyFreezeInput) => postEmergencyFreeze(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LEDGER_KEYS.all });
      if (variables.scope === "global") {
        queryClient.invalidateQueries({ queryKey: LEDGER_KEYS.globalControls() });
      } else if (variables.scope === "asset" && variables.assetId) {
        queryClient.invalidateQueries({ queryKey: LEDGER_KEYS.assetControls(variables.assetId) });
      }
    },
  });
}

// 5. Contract Rules
export function useContractRules(assetId: number) {
  return useQuery({
    queryKey: LEDGER_KEYS.contractRules(assetId),
    queryFn: () => getContractRulesEndpoint({ assetId }),
    enabled: !!assetId,
  });
}

export function useUpsertContractRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContractRulesInput) => postContractRules(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LEDGER_KEYS.contractRules(variables.assetId) });
    },
  });
}

// 6. Global Controls
export function useGlobalControls() {
  return useQuery({
    queryKey: LEDGER_KEYS.globalControls(),
    queryFn: () => getGlobalControlsEndpoint(),
  });
}

// 7. Asset Controls
export function useAssetControls(assetId: number) {
  return useQuery({
    queryKey: LEDGER_KEYS.assetControls(assetId),
    queryFn: () => getAssetControlsEndpoint({ assetId }),
    enabled: !!assetId,
  });
}