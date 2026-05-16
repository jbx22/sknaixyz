import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentSummary } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

export default function AdminRentOverviewPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const { data: summary, isLoading } = useRentSummary();

  const cards = [
    { label: t.totalCollected, value: summary ? `${Number(summary.totalCollected).toLocaleString()} ${t.sar}` : "-", color: "#22c55e" },
    { label: t.totalDue, value: summary ? `${Number(summary.totalDue).toLocaleString()} ${t.sar}` : "-", color: "#3b82f6" },
    { label: t.totalOverdue, value: summary ? `${Number(summary.totalOverdue).toLocaleString()} ${t.sar}` : "-", color: "#ef4444" },
    { label: t.collectionRate, value: summary ? `${summary.collectionRate}%` : "-", color: "#f59e0b" },
    { label: t.activeContracts, value: summary ? String(summary.activeContracts) : "-", color: "#8b5cf6" },
    { label: t.occupancyRate, value: summary ? `${summary.occupancyRate}%` : "-", color: "#06b6d4" },
  ];

  if (isLoading) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.overview}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.rentManagement}</h1>
          <ComplianceNotice />
          <div className={styles.cards}>
            {cards.map((card, i) => (
              <div key={i} className={styles.card} style={{ borderTopColor: card.color }}>
                <div className={styles.cardLabel}>{card.label}</div>
                <div className={styles.cardValue}>{card.value}</div>
              </div>
            ))}
          </div>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>{t.rentCollectionChart}</h3>
              <p className={styles.emptyText}>{t.noData}</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>{t.upcomingPayments}</h3>
              <p className={styles.emptyText}>{t.noData}</p>
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>{t.overdueInvoices}</h3>
            <p className={styles.emptyText}>{t.noData}</p>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
