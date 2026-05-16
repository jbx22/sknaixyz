import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentExpenses } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

export default function AdminRentExpensesPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const [page] = React.useState(1);
  const { data, isLoading } = useRentExpenses({ page, limit: 50 });

  if (isLoading) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.expenses}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.expenses}</h1>
          <ComplianceNotice />
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { }}>{t.createExpense}</button>
          </div>
          {data && data.expenses.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead><tr><th>ID</th><th>{t.property}</th><th>{t.category}</th><th>{t.description}</th><th>{t.amount}</th><th>{t.expenseDate}</th></tr></thead>
                <tbody>
                  {data.expenses.map(e => (
                    <tr key={e.id}>
                      <td>{e.id}</td>
                      <td>{e.propertyId}</td>
                      <td>{e.category}</td>
                      <td>{e.description || "-"}</td>
                      <td>{e.amount.toLocaleString()} {t.sar}</td>
                      <td>{e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : "-"}</td>
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
