import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentSummary } from "../helpers/useRent";
import { exportRentCsv } from "../endpoints/rent/reports/export-csv_GET.schema";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

export default function AdminRentReportsPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const { data: summary, isLoading } = useRentSummary();

  const handleExport = async (type: "invoices" | "payments") => {
    try {
      const result = await exportRentCsv({ type });
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.reports}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.reports}</h1>
          <ComplianceNotice />
          <div className={styles.actions}>
            <button className={styles.btn} onClick={() => handleExport("invoices")}>{t.exportCsv}: {t.invoices}</button>
            <button className={styles.btn} onClick={() => handleExport("payments")}>{t.exportCsv}: {t.payments}</button>
          </div>
          {summary && (
            <>
              <h2 className={styles.sectionTitle}>{t.propertyIncomeReport}</h2>
              <div className={styles.cards}>
                <div className={styles.card} style={{ borderTopColor: "#22c55e" }}>
                  <div className={styles.cardLabel}>{t.grossRentIncome}</div>
                  <div className={styles.cardValue}>{Number(summary.totalCollected).toLocaleString()} {t.sar}</div>
                </div>
                <div className={styles.card} style={{ borderTopColor: "#ef4444" }}>
                  <div className={styles.cardLabel}>{t.totalOverdue}</div>
                  <div className={styles.cardValue}>{Number(summary.totalOverdue).toLocaleString()} {t.sar}</div>
                </div>
                <div className={styles.card} style={{ borderTopColor: "#3b82f6" }}>
                  <div className={styles.cardLabel}>{t.collectionRate}</div>
                  <div className={styles.cardValue}>{summary.collectionRate}%</div>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
