import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRentUnits } from "../endpoints/rent/units/list_GET.schema";
import { createRentUnit } from "../endpoints/rent/units/create_POST.schema";
import { getRentContracts } from "../endpoints/rent/contracts/list_GET.schema";
import { createRentContract } from "../endpoints/rent/contracts/create_POST.schema";
import { updateRentContract } from "../endpoints/rent/contracts/update_POST.schema";
import { getRentInvoices } from "../endpoints/rent/invoices/list_GET.schema";
import { generateRentInvoice } from "../endpoints/rent/invoices/generate_POST.schema";
import { markRentInvoicePaid } from "../endpoints/rent/invoices/mark-paid_POST.schema";
import { getRentPayments } from "../endpoints/rent/payments/list_GET.schema";
import { recordRentPayment } from "../endpoints/rent/payments/record_POST.schema";
import { createPaymentLink } from "../endpoints/rent/payment/create-link_POST.schema";
import { getRentExpenses } from "../endpoints/rent/expenses/list_GET.schema";
import { createRentExpense } from "../endpoints/rent/expenses/create_POST.schema";
import { getOwnershipShares } from "../endpoints/rent/ownership/list_GET.schema";
import { createOwnershipShare } from "../endpoints/rent/ownership/create_POST.schema";
import { getRentAllocations } from "../endpoints/rent/allocations/list_GET.schema";
import { calculateRentAllocations } from "../endpoints/rent/allocations/calculate_POST.schema";
import { getRentDistributions } from "../endpoints/rent/distributions/list_GET.schema";
import { createRentDistribution } from "../endpoints/rent/distributions/create_POST.schema";
import { getRentSummary } from "../endpoints/rent/reports/summary_GET.schema";
import { getPropertyIncomeReport } from "../endpoints/rent/reports/property-income_GET.schema";
import { exportRentCsv } from "../endpoints/rent/reports/export-csv_GET.schema";
import { getTenantInvoices } from "../endpoints/rent/tenant/invoices_GET.schema";
import { getTenantContracts } from "../endpoints/rent/tenant/contracts_GET.schema";
import { getTenantPayments } from "../endpoints/rent/tenant/payments_GET.schema";
import { getInvestorAllocations } from "../endpoints/rent/investor/allocations_GET.schema";
import { getInvestorDistributions } from "../endpoints/rent/investor/distributions_GET.schema";
import { getInvestorProperties } from "../endpoints/rent/investor/properties_GET.schema";
import { getAvailableUnits } from "../endpoints/rent/public/units_GET.schema";
import { applyForRent } from "../endpoints/rent/tenant/apply_POST.schema";

export function useRentUnits(params: Parameters<typeof getRentUnits>[0]) {
  return useQuery({ queryKey: ["rent-units", params], queryFn: () => getRentUnits(params) });
}
export function useCreateRentUnit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRentUnit, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-units"] }); } });
}
export function useRentContracts(params: Parameters<typeof getRentContracts>[0]) {
  return useQuery({ queryKey: ["rent-contracts", params], queryFn: () => getRentContracts(params) });
}
export function useCreateRentContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRentContract, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-contracts"] }); } });
}
export function useUpdateRentContract() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: updateRentContract, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-contracts"] }); } });
}
export function useRentInvoices(params: Parameters<typeof getRentInvoices>[0]) {
  return useQuery({ queryKey: ["rent-invoices", params], queryFn: () => getRentInvoices(params) });
}
export function useGenerateRentInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: generateRentInvoice, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-invoices"] }); } });
}
export function useMarkRentInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: markRentInvoicePaid, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-invoices"] }); qc.invalidateQueries({ queryKey: ["rent-summary"] }); } });
}
export function useRentPayments(params: Parameters<typeof getRentPayments>[0]) {
  return useQuery({ queryKey: ["rent-payments", params], queryFn: () => getRentPayments(params) });
}
export function useRecordRentPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: recordRentPayment, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-payments"] }); qc.invalidateQueries({ queryKey: ["rent-invoices"] }); } });
}
export function useCreatePaymentLink() {
  return useMutation({ mutationFn: createPaymentLink });
}
export function useRentExpenses(params: Parameters<typeof getRentExpenses>[0]) {
  return useQuery({ queryKey: ["rent-expenses", params], queryFn: () => getRentExpenses(params) });
}
export function useCreateRentExpense() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRentExpense, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-expenses"] }); } });
}
export function useOwnershipShares(params: Parameters<typeof getOwnershipShares>[0]) {
  return useQuery({ queryKey: ["rent-ownership", params], queryFn: () => getOwnershipShares(params) });
}
export function useCreateOwnershipShare() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createOwnershipShare, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-ownership"] }); } });
}
export function useRentAllocations(params: Parameters<typeof getRentAllocations>[0]) {
  return useQuery({ queryKey: ["rent-allocations", params], queryFn: () => getRentAllocations(params) });
}
export function useCalculateRentAllocations() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: calculateRentAllocations, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-allocations"] }); } });
}
export function useRentDistributions(params: Parameters<typeof getRentDistributions>[0]) {
  return useQuery({ queryKey: ["rent-distributions", params], queryFn: () => getRentDistributions(params) });
}
export function useCreateRentDistribution() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createRentDistribution, onSuccess: () => { qc.invalidateQueries({ queryKey: ["rent-distributions"] }); } });
}
export function useRentSummary(params?: Parameters<typeof getRentSummary>[0]) {
  return useQuery({ queryKey: ["rent-summary", params], queryFn: () => getRentSummary(params ?? {}) });
}
export function usePropertyIncomeReport(params: Parameters<typeof getPropertyIncomeReport>[0]) {
  return useQuery({ queryKey: ["rent-property-income", params], queryFn: () => getPropertyIncomeReport(params), enabled: !!params.propertyId });
}
export function useTenantInvoices(params: Parameters<typeof getTenantInvoices>[0]) {
  return useQuery({ queryKey: ["tenant-invoices", params], queryFn: () => getTenantInvoices(params) });
}
export function useTenantContracts(params: Parameters<typeof getTenantContracts>[0]) {
  return useQuery({ queryKey: ["tenant-contracts", params], queryFn: () => getTenantContracts(params) });
}
export function useTenantPayments(params: Parameters<typeof getTenantPayments>[0]) {
  return useQuery({ queryKey: ["tenant-payments", params], queryFn: () => getTenantPayments(params) });
}
export function useInvestorAllocations(params: Parameters<typeof getInvestorAllocations>[0]) {
  return useQuery({ queryKey: ["investor-allocations", params], queryFn: () => getInvestorAllocations(params) });
}
export function useInvestorDistributions(params: Parameters<typeof getInvestorDistributions>[0]) {
  return useQuery({ queryKey: ["investor-distributions", params], queryFn: () => getInvestorDistributions(params) });
}
export function useInvestorProperties(params: Parameters<typeof getInvestorProperties>[0]) {
  return useQuery({ queryKey: ["investor-properties", params], queryFn: () => getInvestorProperties(params) });
}
export function useAvailableUnits(params: Parameters<typeof getAvailableUnits>[0]) {
  return useQuery({ queryKey: ["available-units", params], queryFn: () => getAvailableUnits(params) });
}
export function useApplyForRent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applyForRent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["available-units"] }); qc.invalidateQueries({ queryKey: ["tenant-contracts"] }); },
  });
}
