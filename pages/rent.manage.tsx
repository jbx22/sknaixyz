import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Building2, MapPin, Users, FileText, CreditCard, BarChart3, LogIn, Plus } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import { useAuth } from "../helpers/useAuth";
import { RENT_STRINGS } from "../helpers/rentTranslations";
import { useMyProperties } from "../helpers/useRent";
import { AppHeader } from "../components/AppHeader";
import { BottomNav } from "../components/BottomNav";
import { ComplianceNotice } from "../components/rent/ComplianceNotice";
import styles from "./rent.manage.module.css";

const roleBadge: Record<string, string> = {
  owner: styles.badgeOwner,
  developer: styles.badgeDeveloper,
  broker: styles.badgeBroker,
  admin: styles.badgeAdmin,
  investor: styles.badgeBroker,
};

const statusBadge: Record<string, string> = {
  available: styles.badgeAvailable,
  rented: styles.badgeRented,
};

export default function RentManagePage() {
  const { language } = useLanguage();
  const t = RENT_STRINGS[language];
  const { authState } = useAuth();
  const isLoggedIn = authState.type === "authenticated";
  const { data, isLoading } = useMyProperties();

  if (!isLoggedIn) {
    return (
      <>
        <Helmet><title>{language === "ar" ? "إدارة الإيجارات" : "Rent Management"} - SKNAI</title></Helmet>
        <AppHeader showNavLinks />
        <div className={styles.loading}>
          <LogIn size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p>{language === "ar" ? "سجل دخولك لإدارة إيجاراتك" : "Log in to manage your rentals"}</p>
          <Link to="/login" className={styles.btn} style={{ marginTop: 12, background: "#111", color: "#fff", borderColor: "#111" }}>
            {language === "ar" ? "تسجيل الدخول" : "Log In"}
          </Link>
        </div>
        <BottomNav />
      </>
    );
  }

  const properties = data?.properties || [];
  const access = data?.access;
  const fmt = (val: string | number) => Number(val).toLocaleString(language === "ar" ? "ar-SA" : "en-US");

  return (
    <>
      <Helmet><title>{language === "ar" ? "إدارة الإيجارات" : "Rent Management"} - SKNAI</title></Helmet>
      <AppHeader showNavLinks />
      <div className={styles.page}>
        <h1 className={styles.title}>{language === "ar" ? "إدارة الإيجارات" : "Rent Management"}</h1>
        <p className={styles.subtitle}>
          {language === "ar"
            ? "إدارة عقاراتك الإيجارية — عقود، فواتير، مدفوعات، تقارير"
            : "Manage your rental properties — contracts, invoices, payments, reports"}
        </p>

        {access && !access.canManage && (
          <div className={styles.accessBanner}>
            <Building2 size={20} />
            <span className={styles.accessBannerText}>
              {language === "ar"
                ? "لم يتم تعيينك كمالك أو وسيط أو مطور بعد. يمكنك تصفح الإيجارات أو التقديم كمستأجر."
                : "You're not assigned as an owner, broker, or developer yet. You can browse rentals or apply as a tenant."}
            </span>
            <Link to="/rent" className={styles.btn} style={{ marginLeft: "auto" }}>
              {language === "ar" ? "تصفح الإيجارات" : "Browse Rentals"}
            </Link>
          </div>
        )}

        <ComplianceNotice />

        {isLoading && <div className={styles.loading}>{t.loading}</div>}

        {!isLoading && properties.length > 0 && (
          <div className={styles.grid}>
            {properties.map(prop => (
              <div key={prop.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>{prop.title}</div>
                    <div className={styles.cardLocation}>
                      <MapPin size={13} /> {prop.locationName}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                    <span className={`${styles.badge} ${roleBadge[prop.myRole] || styles.badgeOwner}`}>
                      {prop.myRole}
                    </span>
                    <span className={`${styles.badge} ${statusBadge[prop.status] || styles.badgeAvailable}`}>
                      {prop.status}
                    </span>
                  </div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{prop.unitsCount}</div>
                    <div className={styles.statLabel}>{language === "ar" ? "وحدات" : "Units"}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{prop.activeContracts}</div>
                    <div className={styles.statLabel}>{language === "ar" ? "عقود" : "Leases"}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{fmt(prop.monthlyIncome)}</div>
                    <div className={styles.statLabel}>{t.sar}/{language === "ar" ? "شهر" : "mo"}</div>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <Link to={`/rent/manage/${prop.id}/contracts`} className={styles.btn}>
                    <FileText size={14} /> {t.contracts}
                  </Link>
                  <Link to={`/rent/manage/${prop.id}/invoices`} className={styles.btn}>
                    <CreditCard size={14} /> {t.invoices}
                  </Link>
                  <Link to={`/rent/manage/${prop.id}/reports`} className={styles.btn}>
                    <BarChart3 size={14} /> {t.reports}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && properties.length === 0 && (
          <div className={styles.emptyText}>
            <div className={styles.emptyIcon}>🏠</div>
            <p>{language === "ar" ? "لا توجد عقارات تحت إدارتك بعد" : "No properties under your management yet"}</p>
            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
              <Link to="/add-property" className={styles.btn}>
                <Plus size={14} /> {language === "ar" ? "أضف عقار" : "Add Property"}
              </Link>
              <Link to="/rent" className={`${styles.btn} ${styles.btnPrimary}`}>
                {language === "ar" ? "تصفح الإيجارات" : "Browse Rentals"}
              </Link>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
