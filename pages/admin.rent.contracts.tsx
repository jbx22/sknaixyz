import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentContracts, useCreateRentContract } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import { getComplianceLevel, getComplianceLabel, daysUntil, maskNationalId } from "../helpers/compliance";
import styles from "./admin.rent.module.css";

function ComplianceBadge({ endDate }: { endDate: Date | string | null | undefined }) {
  const { language } = useLanguage();
  const level = getComplianceLevel(endDate);
  const remaining = daysUntil(endDate);
  const label = getComplianceLabel(level, remaining, language);

  const colorMap = {
    critical: { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" },
    warning: { bg: "#fffbeb", text: "#d97706", border: "#fcd34d" },
    valid: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  };

  // Dark mode
  const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");
  const dmColors = {
    critical: { bg: "#450a0a", text: "#fca5a5", border: "#991b1b" },
    warning: { bg: "#451a03", text: "#fcd34d", border: "#92400e" },
    valid: { bg: "#052e16", text: "#bbf7d0", border: "#166534" },
  };

  const c = isDark ? dmColors[level] : colorMap[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        lineHeight: "1.4",
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
      title={language === "ar" ? `الأيام المتبقية: ${remaining ?? "غير محدد"}` : `Days remaining: ${remaining ?? "N/A"}`}
    >
      {level === "critical" && <span>🔴</span>}
      {level === "warning" && <span>🟡</span>}
      {level === "valid" && <span>🟢</span>}
      <span>{label}</span>
    </span>
  );
}

export default function AdminRentContractsPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const [page] = React.useState(1);
  const { data, isLoading } = useRentContracts({ page, limit: 50 });
  const createContract = useCreateRentContract();

  if (isLoading) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.contracts}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.contracts}</h1>
          <ComplianceNotice />
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { /* form dialog would go here */ }}>{t.createContract}</button>
          </div>
          {data && data.contracts.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t.property}</th>
                    <th>{t.tenant}</th>
                    <th>{t.monthlyRent}</th>
                    <th>{t.status}</th>
                    <th>الامتثال / Compliance</th>
                    <th>{t.startDate}</th>
                    <th>{t.endDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contracts.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td style={{ fontSize: "13px", fontWeight: 500 }}>#{c.propertyId}{c.unitId ? ` / U-${c.unitId}` : ""}</td>
                      <td>
                        <span title={language === "ar" ? "رقم الهوية المقنع (متوافق مع NDMO)" : "Masked ID (NDMO compliant)"} style={{ fontFamily: "monospace", fontSize: "12px" }}>
                          {maskNationalId(c.tenantUserId)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{Number(c.monthlyRent).toLocaleString()} {t.sar}</td>
                      <td>
                        <span className={`${styles.badge} ${c.contractStatus === "active" ? styles.badgeActive : c.contractStatus === "expired" ? styles.badgeExpired : c.contractStatus === "terminated" ? styles.badgeExpired : styles.badgeDraft}`}>
                          {c.contractStatus}
                        </span>
                      </td>
                      <td><ComplianceBadge endDate={c.endDate} /></td>
                      <td>{c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}</td>
                      <td style={{ fontWeight: c.endDate ? (getComplianceLevel(c.endDate) !== "valid" ? 700 : 400) : 400 }}>
                        {c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}
                        {c.endDate && daysUntil(c.endDate) !== null && daysUntil(c.endDate)! <= 60 && (
                          <span style={{ display: "block", fontSize: "10px", color: daysUntil(c.endDate)! <= 10 ? "#dc2626" : "#d97706" }}>
                            {daysUntil(c.endDate)} {language === "ar" ? "يوم متبقي" : "days left"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className={styles.emptyText}>{t.noData}</p>}
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
