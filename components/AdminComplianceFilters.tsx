import React, { useState, useEffect } from "react";
import { useLanguage } from "../helpers/useLanguage";
import { useDebounce } from "../helpers/useDebounce";
import { InputType as ComplianceLogsInput } from "../endpoints/admin/compliance/logs_GET.schema";
import { Button } from "./Button";
import { Search, X } from "lucide-react";
import styles from "./AdminComplianceFilters.module.css";

interface AdminComplianceFiltersProps {
  onFilterChange: (filters: Omit<ComplianceLogsInput, "page" | "pageSize">) => void;
  isLoading: boolean;
}

export const AdminComplianceFilters = ({ onFilterChange, isLoading }: AdminComplianceFiltersProps) => {
  const { language } = useLanguage();
  
  // Local state for inputs
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Debounce text inputs
  const debouncedAction = useDebounce(action, 500);
  const debouncedUserId = useDebounce(userId, 500);

  // Effect to trigger filter change
  useEffect(() => {
    const filters: Omit<ComplianceLogsInput, "page" | "pageSize"> = {};

    if (entityType && entityType !== "all") filters.entityType = entityType;
    if (debouncedAction) filters.action = debouncedAction;
    if (debouncedUserId) filters.userId = parseInt(debouncedUserId);
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    onFilterChange(filters);
  }, [entityType, debouncedAction, debouncedUserId, dateFrom, dateTo, onFilterChange]);

  const clearFilters = () => {
    setEntityType("");
    setAction("");
    setUserId("");
    setDateFrom("");
    setDateTo("");
  };

  const t = {
    ar: {
      entityType: "نوع الكيان",
      action: "الإجراء",
      userId: "رقم المستخدم",
      dateFrom: "من تاريخ",
      dateTo: "إلى تاريخ",
      all: "الكل",
      clear: "مسح التصفيات",
      searchPlaceholder: "بحث...",
      types: {
        kyc: "KYC",
        investment: "استثمار",
        wallet: "محفظة",
        income_distribution: "توزيع أرباح",
        acknowledgement: "إقرار",
      }
    },
    en: {
      entityType: "Entity Type",
      action: "Action",
      userId: "User ID",
      dateFrom: "Date From",
      dateTo: "Date To",
      all: "All",
      clear: "Clear Filters",
      searchPlaceholder: "Search...",
      types: {
        kyc: "KYC",
        investment: "Investment",
        wallet: "Wallet",
        income_distribution: "Income Distribution",
        acknowledgement: "Acknowledgement",
      }
    }
  }[language];

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.grid}>
        {/* Entity Type */}
        <div className={styles.field}>
          <label className={styles.label}>{t.entityType}</label>
          <select 
            className={styles.select}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="">{t.all}</option>
            <option value="kyc">{t.types.kyc}</option>
            <option value="investment">{t.types.investment}</option>
            <option value="wallet">{t.types.wallet}</option>
            <option value="income_distribution">{t.types.income_distribution}</option>
            <option value="acknowledgement">{t.types.acknowledgement}</option>
          </select>
        </div>

        {/* Action Search */}
        <div className={styles.field}>
          <label className={styles.label}>{t.action}</label>
          <div className={styles.inputWrapper}>
            <Search size={16} className={styles.icon} />
            <input
              type="text"
              className={styles.input}
              placeholder={t.searchPlaceholder}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
        </div>

        {/* User ID */}
        <div className={styles.field}>
          <label className={styles.label}>{t.userId}</label>
          <input
            type="number"
            className={styles.input}
            placeholder="ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        {/* Date Range */}
        <div className={styles.field}>
          <label className={styles.label}>{t.dateFrom}</label>
          <input
            type="date"
            className={styles.input}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t.dateTo}</label>
          <input
            type="date"
            className={styles.input}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {(entityType || action || userId || dateFrom || dateTo) && (
        <div className={styles.actions}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className={styles.clearButton}
          >
            <X size={14} />
            {t.clear}
          </Button>
        </div>
      )}
    </div>
  );
};