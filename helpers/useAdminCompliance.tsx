import { useQuery, useMutation } from "@tanstack/react-query";
import superjson from "superjson";
import {
  getAdminComplianceLogs,
  InputType as ComplianceLogsInput,
} from "../endpoints/admin/compliance/logs_GET.schema";
import type { ComplianceStats } from "../endpoints/admin/compliance/stats_GET";
import type { AuditChecklistResponse } from "../endpoints/admin/compliance/checklist_GET";

const API_BASE = "/_api";

export const ADMIN_COMPLIANCE_KEYS = {
  all: ["admin", "compliance"] as const,
  logs: (params: ComplianceLogsInput) =>
    [...ADMIN_COMPLIANCE_KEYS.all, "logs", params] as const,
  stats: ["admin", "compliance", "stats"] as const,
  checklist: ["admin", "compliance", "checklist"] as const,
};

export function useAdminComplianceLogs(params: ComplianceLogsInput) {
  return useQuery({
    queryKey: ADMIN_COMPLIANCE_KEYS.logs(params),
    queryFn: () => getAdminComplianceLogs(params),
    placeholderData: (previousData) => previousData,
  });
}

// Fetch compliance dashboard stats
async function getComplianceStats(): Promise<ComplianceStats> {
  const res = await fetch(`${API_BASE}/admin/compliance/stats`);
  if (!res.ok) {
    const err = superjson.parse<{ error: string }>(await res.text());
    throw new Error(err.error);
  }
  return superjson.parse<ComplianceStats>(await res.text());
}

export function useComplianceStats() {
  return useQuery({
    queryKey: ADMIN_COMPLIANCE_KEYS.stats,
    queryFn: getComplianceStats,
    refetchInterval: 60_000, // Auto-refresh every 60s
  });
}

// Check FAL license
async function checkFalLicense(licenseNumber: string): Promise<{ isValid: boolean; holderName?: string; message?: string }> {
  const res = await fetch(`${API_BASE}/admin/compliance/check-fal-license?licenseNumber=${encodeURIComponent(licenseNumber)}`);
  if (!res.ok) {
    const err = superjson.parse<{ error: string }>(await res.text());
    throw new Error(err.error);
  }
  return superjson.parse(await res.text());
}

export function useCheckFalLicense() {
  return useMutation({
    mutationFn: (licenseNumber: string) => checkFalLicense(licenseNumber),
  });
}

// Mirror payment to Ejar
async function ejarMirrorPayment(payload: { contractId: number; paymentMethod: string; amountSar?: number }) {
  const res = await fetch(`${API_BASE}/admin/compliance/ejar-mirror`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = superjson.parse<{ error: string }>(await res.text());
    throw new Error(err.error);
  }
  return superjson.parse<{ success: boolean; ejarReference?: string; message?: string }>(await res.text());
}

export function useEjarMirrorPayment() {
  return useMutation({
    mutationFn: (payload: { contractId: number; paymentMethod: string; amountSar?: number }) =>
      ejarMirrorPayment(payload),
  });
}

// Fetch audit checklist
async function getComplianceChecklist(): Promise<AuditChecklistResponse> {
  const res = await fetch(`${API_BASE}/admin/compliance/checklist`);
  if (!res.ok) {
    const err = superjson.parse<{ error: string }>(await res.text());
    throw new Error(err.error);
  }
  return superjson.parse<AuditChecklistResponse>(await res.text());
}

export function useComplianceChecklist() {
  return useQuery({
    queryKey: ADMIN_COMPLIANCE_KEYS.checklist,
    queryFn: getComplianceChecklist,
    refetchInterval: 300_000, // Auto-refresh every 5 min
  });
}