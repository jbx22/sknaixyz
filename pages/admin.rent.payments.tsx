import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentPayments } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

export default function AdminRentPaymentsPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const [page] = React.useState(1);
  const { data, isLoading } = useRentPayments({ page, limit: 50 });

  if (isLoading) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.payments}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.payments}</h1>
          <ComplianceNotice />
          {data && data.payments.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead><tr><th>ID</th><th>{t.invoice}</th><th>{t.tenant}</th><th>{t.amount}</th><th>{t.paymentMethod}</th><th>{t.status}</th><th>{t.transactionRef}</th></tr></thead>
                <tbody>
                  {data.payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.invoiceId}</td>
                      <td>{p.tenantUserId}</td>
                      <td>{Number(p.amount).toLocaleString()} {t.sar}</td>
                      <td>{p.paymentMethod}</td>
                      <td><span className={`${styles.badge} ${p.paymentStatus === "completed" ? styles.badgePaid : p.paymentStatus === "failed" ? styles.badgeOverdue : styles.badgePending}`}>{p.paymentStatus}</span></td>
                      <td>{p.transactionReference || "-"}</td>
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
