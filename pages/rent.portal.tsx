import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FileText, CreditCard, Home, CalendarDays, LogIn } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import { useAuth } from "../helpers/useAuth";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { useTenantContracts, useTenantInvoices, useTenantPayments } from "../helpers/useRent";
import { AppHeader } from "../components/AppHeader";
import { BottomNav } from "../components/BottomNav";
import styles from "./rent.portal.module.css";

export default function RentPortalPage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const { authState } = useAuth();
  const isLoggedIn = authState.type === "authenticated";

  const [activeTab, setActiveTab] = useState<"contracts" | "invoices" | "payments">("contracts");

  const { data: contractsData, isLoading: loadingContracts } = useTenantContracts({ page: 1, limit: 50 });
  const { data: invoicesData, isLoading: loadingInvoices } = useTenantInvoices({ page: 1, limit: 50 });
  const { data: paymentsData, isLoading: loadingPayments } = useTenantPayments({ page: 1, limit: 50 });

  if (!isLoggedIn) {
    return (
      <>
        <Helmet><title>{t.myRentals} - SKNAI</title></Helmet>
        <AppHeader showNavLinks />
        <div className={styles.loginPrompt}>
          <LogIn size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p>{language === "ar" ? "سجل دخولك لعرض إيجاراتك" : "Log in to view your rentals"}</p>
          <Link to="/login" className={styles.loginBtn}>{language === "ar" ? "تسجيل الدخول" : "Log In"}</Link>
        </div>
        <BottomNav />
      </>
    );
  }

  const contracts = contractsData?.contracts || [];
  const invoices = invoicesData?.invoices || [];
  const payments = paymentsData?.payments || [];

  const activeContracts = contracts.filter(c => c.contractStatus === "active");
  const pendingContracts = contracts.filter(c => c.contractStatus === "pending");
  const paidInvoices = invoices.filter(i => i.invoiceStatus === "paid");
  const totalDue = invoices.filter(i => i.invoiceStatus !== "paid").reduce((sum, i) => sum + Number(i.amount) - Number(i.paidAmount), 0);

  const fmt = (val: string | number) => Number(val).toLocaleString(language === "ar" ? "ar-SA" : "en-US");
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "-";

  return (
    <>
      <Helmet><title>{t.myRentals} - SKNAI</title></Helmet>
      <AppHeader showNavLinks />
      <div className={styles.page}>
        <h1 className={styles.title}>{t.myRentals}</h1>
        <p className={styles.subtitle}>{language === "ar" ? "إدارة عقودك الإيجارية والفواتير والمدفوعات" : "Manage your rental contracts, invoices, and payments"}</p>

        <div className={styles.cards}>
          <div className={styles.card} style={{ borderTopColor: "#22c55e" }}>
            <div className={styles.cardLabel}>{language === "ar" ? "عقود نشطة" : "Active Contracts"}</div>
            <div className={styles.cardValue}>{activeContracts.length}</div>
          </div>
          <div className={styles.card} style={{ borderTopColor: "#f59e0b" }}>
            <div className={styles.cardLabel}>{language === "ar" ? "طلبات معلقة" : "Pending Applications"}</div>
            <div className={styles.cardValue}>{pendingContracts.length}</div>
          </div>
          <div className={styles.card} style={{ borderTopColor: "#3b82f6" }}>
            <div className={styles.cardLabel}>{language === "ar" ? "مدفوع" : "Total Paid"}</div>
            <div className={styles.cardValue}>{fmt(paidInvoices.reduce((s, i) => s + Number(i.paidAmount), 0))} <span style={{ fontSize: 12, fontWeight: 400 }}>{t.sar}</span></div>
          </div>
          <div className={styles.card} style={{ borderTopColor: "#ef4444" }}>
            <div className={styles.cardLabel}>{language === "ar" ? "مستحق" : "Amount Due"}</div>
            <div className={styles.cardValue}>{fmt(totalDue)} <span style={{ fontSize: 12, fontWeight: 400 }}>{t.sar}</span></div>
          </div>
        </div>

        <div className={styles.tabs}>
          {([["contracts", t.contracts], ["invoices", t.invoices], ["payments", t.payments]] as const).map(([key, label]) => (
            <button key={key} className={`${styles.tab} ${activeTab === key ? styles.tabActive : ""}`} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>

        {activeTab === "contracts" && (
          <div>
            {loadingContracts && <div className={styles.loading}>{t.loading}</div>}
            {contracts.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className={styles.table}>
                  <thead><tr><th>ID</th><th>{t.property}</th><th>{t.monthlyRent}</th><th>{t.status}</th><th>{t.startDate}</th><th>{t.endDate}</th></tr></thead>
                  <tbody>
                    {contracts.map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>#{c.propertyId}{c.unitId ? ` / ${language === "ar" ? "وحدة" : "Unit"} ${c.unitId}` : ""}</td>
                        <td>{fmt(c.monthlyRent)} {t.sar}</td>
                        <td><span className={`${styles.badge} ${c.contractStatus === "active" ? styles.badgeActive : c.contractStatus === "pending" ? styles.badgePending : styles.badgeDraft}`}>{c.contractStatus}</span></td>
                        <td>{fmtDate(c.startDate)}</td>
                        <td>{fmtDate(c.endDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loadingContracts && <p className={styles.emptyText}>{language === "ar" ? "لا توجد عقود" : "No contracts yet"} — <Link to="/rent">{language === "ar" ? "تصفح الوحدات المتاحة" : "Browse available units"}</Link></p>}
          </div>
        )}

        {activeTab === "invoices" && (
          <div>
            {loadingInvoices && <div className={styles.loading}>{t.loading}</div>}
            {invoices.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className={styles.table}>
                  <thead><tr><th>ID</th><th>{t.amount}</th><th>{t.paid}</th><th>{t.status}</th><th>{t.dueDate}</th></tr></thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.id}</td>
                        <td>{fmt(inv.amount)} {t.sar}</td>
                        <td>{fmt(inv.paidAmount)} {t.sar}</td>
                        <td><span className={`${styles.badge} ${inv.invoiceStatus === "paid" ? styles.badgePaid : inv.invoiceStatus === "overdue" ? styles.badgeOverdue : styles.badgePending}`}>{inv.invoiceStatus}</span></td>
                        <td>{fmtDate(inv.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loadingInvoices && <p className={styles.emptyText}>{language === "ar" ? "لا توجد فواتير" : "No invoices yet"}</p>}
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            {loadingPayments && <div className={styles.loading}>{t.loading}</div>}
            {payments.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className={styles.table}>
                  <thead><tr><th>ID</th><th>{t.amount}</th><th>{t.paymentMethod}</th><th>{t.status}</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{fmt(p.amount)} {t.sar}</td>
                        <td>{p.paymentMethod}</td>
                        <td><span className={`${styles.badge} ${p.paymentStatus === "completed" ? styles.badgePaid : styles.badgePending}`}>{p.paymentStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loadingPayments && <p className={styles.emptyText}>{language === "ar" ? "لا توجد مدفوعات" : "No payments yet"}</p>}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Link to="/rent" className={`${styles.btn} ${styles.btnPrimary}`}>{language === "ar" ? "تصفح المزيد من الوحدات" : "Browse More Units"}</Link>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
