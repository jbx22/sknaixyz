import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { useAdminComplianceLogs } from "../helpers/useAdminCompliance";
import { AdminComplianceTable } from "../components/AdminComplianceTable";
import { AdminComplianceFilters } from "../components/AdminComplianceFilters";
import { InputType as ComplianceLogsInput } from "../endpoints/admin/compliance/logs_GET.schema";
import styles from "./admin.compliance.module.css";

export default function AdminCompliancePage() {
  const { language } = useLanguage();
  
  // State for filters and pagination
  const [filters, setFilters] = useState<Omit<ComplianceLogsInput, "page" | "pageSize">>({});
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch data
  const { data, isLoading, isError } = useAdminComplianceLogs({
    ...filters,
    page,
    pageSize,
  });

  const handleFilterChange = (newFilters: Omit<ComplianceLogsInput, "page" | "pageSize">) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const translations = {
    ar: {
      title: "سجل المطابقة والامتثال",
      subtitle: "تتبع جميع إجراءات الامتثال والتدقيق",
    },
    en: {
      title: "Compliance Audit Trail",
      subtitle: "Track all compliance and audit actions",
    },
  };

  const t = translations[language];

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t.title} | SKNAI Admin</title>
      </Helmet>

      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>

      <div className={styles.content}>
        <AdminComplianceFilters 
          onFilterChange={handleFilterChange} 
          isLoading={isLoading}
        />

        <AdminComplianceTable 
          data={data?.logs || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}