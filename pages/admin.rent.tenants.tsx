import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { useRentContracts, useRentInvoices } from "../helpers/useRent";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./admin.rent.module.css";

export default function AdminRentTenantsPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const { data: contracts, isLoading } = useRentContracts({ page: 1, limit: 100 });
  const { data: invoices } = useRentInvoices({ page: 1, limit: 100, invoiceStatus: "overdue" });

  const tenants = React.useMemo(() => {
    if (!contracts) return [];
    const map = new Map<number, { tenantId: number; contractCount: number; totalRent: number; overdueCount: number }>();
    for (const c of contracts.contracts) {
      if (!map.has(c.tenantUserId)) map.set(c.tenantUserId, { tenantId: c.tenantUserId, contractCount: 0, totalRent: 0, overdueCount: 0 });
      const entry = map.get(c.tenantUserId)!;
      entry.contractCount++;
      entry.totalRent += Number(c.monthlyRent);
    }
    return Array.from(map.values());
  }, [contracts]);

  if (isLoading) return <div className={styles.loading}>{t.loading}</div>;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet><title>{t.rentManagement} - {t.tenants}</title></Helmet>
        <div className={styles.page}>
          <h1 className={styles.title}>{t.tenants}</h1>
          <ComplianceNotice />
          {tenants.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead><tr><th>{t.tenant} ID</th><th>{t.contracts}</th><th>{t.monthlyRent}</th></tr></thead>
                <tbody>
                  {tenants.map(ten => (
                    <tr key={ten.tenantId}>
                      <td>{ten.tenantId}</td>
                      <td>{ten.contractCount}</td>
                      <td>{ten.totalRent.toLocaleString()} {t.sar}</td>
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
