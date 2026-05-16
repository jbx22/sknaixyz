import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useOwnershipShares, useRentAllocations, useRentDistributions } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

export default function AdminRentInvestorsPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const { data: shares, isLoading: loadingShares } = useOwnershipShares({ page: 1, limit: 100 });
  const { data: allocations } = useRentAllocations({ page: 1, limit: 50 });
  const { data: distributions } = useRentDistributions({ page: 1, limit: 50 });

  if (loadingShares) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.investors}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.investors}</h1>
          <ComplianceNotice />
          <h2 className={styles.sectionTitle}>{t.ownershipShares}</h2>
          {shares && shares.shares.length > 0 ? (
            <div style={{ overflowX: "auto", marginBottom: 32 }}>
              <table className={styles.table}>
                <thead><tr><th>ID</th><th>{t.property}</th><th>Investor</th><th>{t.ownershipPercentage}</th><th>{t.investmentAmount}</th></tr></thead>
                <tbody>
                  {shares.shares.map(s => (
                    <tr key={s.id}><td>{s.id}</td><td>{s.propertyId}</td><td>{s.userId}</td><td>{s.ownershipPercentage}%</td><td>{s.investmentAmount.toLocaleString()} {t.sar}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className={styles.emptyText}>{t.noData}</p>}
          <h2 className={styles.sectionTitle}>{t.distributions}</h2>
          {distributions && distributions.distributions.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead><tr><th>ID</th><th>Investor</th><th>{t.property}</th><th>{t.amount}</th><th>{t.status}</th></tr></thead>
                <tbody>
                  {distributions.distributions.map(d => (
                    <tr key={d.id}><td>{d.id}</td><td>{d.investorUserId}</td><td>{d.propertyId}</td><td>{d.amount.toLocaleString()} {t.sar}</td>
                      <td><span className={`${styles.badge} ${d.distributionStatus === "completed" ? styles.badgePaid : styles.badgePending}`}>{d.distributionStatus}</span></td></tr>
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
