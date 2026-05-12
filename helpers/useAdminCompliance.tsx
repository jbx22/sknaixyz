import { useQuery } from "@tanstack/react-query";
import {
  getAdminComplianceLogs,
  InputType as ComplianceLogsInput,
} from "../endpoints/admin/compliance/logs_GET.schema";

export const ADMIN_COMPLIANCE_KEYS = {
  all: ["admin", "compliance"] as const,
  logs: (params: ComplianceLogsInput) =>
    [...ADMIN_COMPLIANCE_KEYS.all, "logs", params] as const,
};

export function useAdminComplianceLogs(params: ComplianceLogsInput) {
  return useQuery({
    queryKey: ADMIN_COMPLIANCE_KEYS.logs(params),
    queryFn: () => getAdminComplianceLogs(params),
    placeholderData: (previousData) => previousData,
  });
}