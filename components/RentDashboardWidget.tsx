import React from "react";
import { Link } from "react-router-dom";
import { Home, CreditCard, FileText, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { useTenantContracts, useTenantInvoices, useTenantPayments, useMyProperties } from "../helpers/useRent";
import styles from "./RentDashboardWidget.module.css";

export const RentDashboardWidget: React.FC = () => {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const isLoggedIn = authState.type === "authenticated";

  const isAr = language === "ar";
  const fmt = (val: string | number) => Number(val).toLocaleString(isAr ? "ar-SA" : "en-US");

  // Tenant data
  const { data: contractsData } = useTenantContracts({ page: 1, limit: 5 });
  const { data: invoicesData } = useTenantInvoices({ page: 1, limit: 5 });
  const { data: paymentsData } = useTenantPayments({ page: 1, limit: 5 });
  
  // Property manager data
  const { data: myPropsData } = useMyProperties();

  if (!isLoggedIn) return null;

  const contracts = contractsData?.contracts || [];
  const invoices = invoicesData?.invoices || [];
  const payments = paymentsData?.payments || [];
  const myProperties = myPropsData?.properties || [];
  const isManager = myPropsData?.access?.canManage || false;

  const activeContracts = contracts.filter(c => c.contractStatus === "active").length;
  const pendingInvoices = invoices.filter(i => i.invoiceStatus !== "paid");
  const totalDue = pendingInvoices.reduce((s, i) => s + Number(i.amount) - Number(i.paidAmount), 0);
  const lastPayment = payments.length > 0 ? payments[0] : null;

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Home size={18} />
          {isAr ? "ملخص الإيجار" : "Rent Summary"}
        </h3>
        <Link to={isManager ? "/rent/manage" : "/rent/portal"} className={styles.link}>
          {isAr ? "عرض الكل" : "View All"} →
        </Link>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardIcon}><FileText size={16} /></div>
          <div className={styles.cardValue}>{activeContracts}</div>
          <div className={styles.cardLabel}>{isAr ? "عقود نشطة" : "Active Leases"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}><CreditCard size={16} /></div>
          <div className={styles.cardValue}>{fmt(totalDue)}</div>
          <div className={styles.cardLabel}>{isAr ? "مستحق (ر.س)" : "Due (SAR)"}</div>
        </div>
        {isManager && (
          <div className={styles.card}>
            <div className={styles.cardIcon}><TrendingUp size={16} /></div>
            <div className={styles.cardValue}>{fmt(myProperties.reduce((s, p) => s + p.monthlyIncome, 0))}</div>
            <div className={styles.cardLabel}>{isAr ? "دخل شهري (ر.س)" : "Monthly Income (SAR)"}</div>
          </div>
        )}
        {lastPayment && (
          <div className={styles.card}>
            <div className={styles.cardIcon}><Clock size={16} /></div>
            <div className={styles.cardValue}>{fmt(lastPayment.amount)}</div>
            <div className={styles.cardLabel}>{isAr ? "آخر دفعة" : "Last Payment"}</div>
          </div>
        )}
      </div>

      {pendingInvoices.length > 0 && (
        <div className={styles.alert}>
          {isAr
            ? `لديك ${pendingInvoices.length} فاتورة معلقة بإجمالي ${fmt(totalDue)} ر.س`
            : `You have ${pendingInvoices.length} pending invoice(s) totaling ${fmt(totalDue)} SAR`}
        </div>
      )}

      {contracts.length === 0 && myProperties.length === 0 && (
        <div className={styles.empty}>
          <p>{isAr ? "لا توجد إيجارات بعد" : "No rentals yet"}</p>
          <Link to="/rent" className={styles.browseBtn}>
            {isAr ? "تصفح الإيجارات" : "Browse Rentals"}
          </Link>
        </div>
      )}
    </div>
  );
};
