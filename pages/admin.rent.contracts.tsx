import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentContracts, useCreateRentContract } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

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
                <thead><tr><th>ID</th><th>{t.property}</th><th>{t.tenant}</th><th>{t.monthlyRent}</th><th>{t.status}</th><th>{t.startDate}</th><th>{t.endDate}</th></tr></thead>
                <tbody>
                  {data.contracts.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.propertyId}</td>
                      <td>{c.tenantUserId}</td>
                      <td>{Number(c.monthlyRent).toLocaleString()} {t.sar}</td>
                      <td><span className={`${styles.badge} ${c.contractStatus === "active" ? styles.badgeActive : c.contractStatus === "expired" ? styles.badgeExpired : styles.badgeDraft}`}>{c.contractStatus}</span></td>
                      <td>{c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"}</td>
                      <td>{c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"}</td>
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
