import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentInvoices, useGenerateRentInvoice, useMarkRentInvoicePaid } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

export default function AdminRentInvoicesPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const [page] = React.useState(1);
  const { data, isLoading } = useRentInvoices({ page, limit: 50 });
  const generateInvoice = useGenerateRentInvoice();
  const markPaid = useMarkRentInvoicePaid();

  const handleMarkPaid = (id: number) => markPaid.mutate({ invoiceId: id });

  if (isLoading) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.invoices}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.invoices}</h1>
          <ComplianceNotice />
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { }}>{t.generateInvoice}</button>
          </div>
          {data && data.invoices.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead><tr><th>ID</th><th>{t.contract}</th><th>{t.amount}</th><th>{t.status}</th><th>{t.dueDate}</th><th>{t.period}</th><th>{t.paid}</th><th></th></tr></thead>
                <tbody>
                  {data.invoices.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>{inv.contractId}</td>
                      <td>{Number(inv.amount).toLocaleString()} {t.sar}</td>
                      <td><span className={`${styles.badge} ${inv.invoiceStatus === "paid" ? styles.badgePaid : inv.invoiceStatus === "overdue" ? styles.badgeOverdue : styles.badgePending}`}>{inv.invoiceStatus}</span></td>
                      <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</td>
                      <td>{inv.periodStart && inv.periodEnd ? `${new Date(inv.periodStart).toLocaleDateString()} - ${new Date(inv.periodEnd).toLocaleDateString()}` : "-"}</td>
                      <td>{Number(inv.paidAmount).toLocaleString()} {t.sar}</td>
                      <td>{inv.invoiceStatus !== "paid" && <button className={styles.btn} onClick={() => handleMarkPaid(inv.id)}>{t.markAsPaid}</button>}</td>
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
