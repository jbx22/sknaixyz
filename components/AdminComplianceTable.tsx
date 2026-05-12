import React, { useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, FileJson } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import { ComplianceLogItem } from "../endpoints/admin/compliance/logs_GET.schema";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "./Pagination";
import styles from "./AdminComplianceTable.module.css";

interface AdminComplianceTableProps {
  data: ComplianceLogItem[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const AdminComplianceTable = ({
  data,
  isLoading,
  total,
  page,
  pageSize,
  onPageChange,
}: AdminComplianceTableProps) => {
  const { language } = useLanguage();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(total / pageSize);

  const getBadgeVariant = (entityType: string) => {
    switch (entityType) {
      case "kyc": return "default"; // primary
      case "investment": return "success";
      case "wallet": return "warning";
      case "income_distribution": return "secondary";
      case "acknowledgement": return "outline";
      default: return "outline";
    }
  };

  const t = {
    ar: {
      date: "التاريخ/الوقت",
      user: "المستخدم",
      entity: "الكيان",
      action: "الإجراء",
      ip: "عنوان IP",
      details: "التفاصيل",
      noData: "لا توجد سجلات مطابقة",
      unknownUser: "مستخدم غير معروف",
      system: "النظام",
    },
    en: {
      date: "Date/Time",
      user: "User",
      entity: "Entity",
      action: "Action",
      ip: "IP Address",
      details: "Details",
      noData: "No compliance logs found",
      unknownUser: "Unknown User",
      system: "System",
    }
  }[language];

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className={styles.skeletonRow} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileJson size={48} className={styles.emptyIcon} />
        <p>{t.noData}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thExpand}></th>
              <th className={styles.th}>{t.date}</th>
              <th className={styles.th}>{t.user}</th>
              <th className={styles.th}>{t.entity}</th>
              <th className={styles.th}>{t.action}</th>
              <th className={styles.th}>{t.ip}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((log) => (
              <React.Fragment key={log.id}>
                <tr 
                  className={`${styles.tr} ${expandedRows.has(log.id) ? styles.expanded : ''}`}
                  onClick={() => toggleRow(log.id)}
                >
                  <td className={styles.tdExpand}>
                    {expandedRows.has(log.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.dateCell}>
                      <span className={styles.date}>
                                                {new Date(log.createdAt).toLocaleDateString("en-CA")}
                      </span>
                      <span className={styles.time}>
                                                {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {log.userId ? (
                      <div className={styles.userCell}>
                        <span className={styles.userName}>{log.userDisplayName || t.unknownUser}</span>
                        <span className={styles.userEmail}>{log.userEmail}</span>
                      </div>
                    ) : (
                      <span className={styles.systemBadge}>{t.system}</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <Badge variant={getBadgeVariant(log.entityType)}>
                      {log.entityType}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.actionText}>{log.action}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.ipText}>{log.ipAddress || "-"}</span>
                  </td>
                </tr>
                {expandedRows.has(log.id) && (
                  <tr className={styles.detailsRow}>
                    <td colSpan={6} className={styles.detailsTd}>
                      <div className={styles.detailsContent}>
                        <h4 className={styles.detailsTitle}>{t.details}</h4>
                        <pre className={styles.jsonBlock}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  aria-disabled={page === 1}
                  className={page === 1 ? styles.disabledLink : ''}
                />
              </PaginationItem>
              
              {/* Simple pagination logic for brevity */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page could be more complex
                // Here we just show first 5 or sliding window if needed, 
                // but for simplicity let's just show current page context
                let p = i + 1;
                if (totalPages > 5 && page > 3) {
                  p = page - 2 + i;
                }
                if (p > totalPages) return null;
                
                return (
                  <PaginationItem key={p}>
                    <PaginationLink 
                      isActive={page === p}
                      onClick={() => onPageChange(p)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? styles.disabledLink : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};