import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Building2, Coins, LayoutDashboard, MapPinned, ShieldCheck, UserRoundCheck, WalletCards } from "lucide-react";
import { Button } from "../components/Button";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./sakn-flows.module.css";

const roles = [
  {
    icon: <Coins size={22} />,
    titleEn: "Investor dashboard",
    titleAr: "لوحة المستثمر",
    textEn: "Browse fractional ownership offerings, complete KYC, fund wallet, invest, and track income.",
    textAr: "تصفح فرص الملكية الجزئية، أكمل التحقق، اشحن المحفظة، استثمر، وتابع الدخل.",
    to: "/invest",
  },
  {
    icon: <Building2 size={22} />,
    titleEn: "Real-estate office dashboard",
    titleAr: "لوحة المكتب العقاري",
    textEn: "Add properties, upload media, request tokenization, and follow approval status.",
    textAr: "أضف العقارات، ارفع الوسائط، اطلب التحويل للملكية الجزئية، وتابع حالة الموافقة.",
    to: "/dashboard",
  },
  {
    icon: <MapPinned size={22} />,
    titleEn: "Developer dashboard",
    titleAr: "لوحة المطور",
    textEn: "Publish projects, run AI reports, prepare offerings, and move assets to admin review.",
    textAr: "انشر المشاريع، شغل تقارير الذكاء الاصطناعي، جهز العروض، وانقل الأصول لمراجعة الإدارة.",
    to: "/add-property",
  },
  {
    icon: <ShieldCheck size={22} />,
    titleEn: "Admin flow",
    titleAr: "مسار الإدارة",
    textEn: "Review users, properties, tokenization requests, KYC, compliance, subscriptions, and income distribution.",
    textAr: "راجع المستخدمين والعقارات وطلبات الترميز و KYC والامتثال والاشتراكات وتوزيع الدخل.",
    to: "/admin/dashboard",
  },
];

export default function DashboardsPage() {
  const { language } = useLanguage();
  const ar = language === "ar";

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{ar ? "لوحات التحكم" : "Multi Dashboards"} | SKNAI</title>
      </Helmet>

      <section className={styles.hero}>
        <span className={styles.eyebrow}><LayoutDashboard size={16} /> {ar ? "لوحات SAkn AI مضافة" : "SAkn AI dashboards added"}</span>
        <h1 className={styles.title}>{ar ? "لوحات متعددة لكل مسار عمل" : "Multi-dashboard workflows for every role"}</h1>
        <p className={styles.subtitle}>
          {ar
            ? "تم وصل مسارات المستثمر والمكتب العقاري والمطور والإدارة داخل SKNAI بدون تغيير الواجهة الأساسية."
            : "Investor, real-estate office, developer, and admin workflows are wired into SKNAI without changing the core UI/UX."}
        </p>
        <div className={styles.actions}>
          <Button asChild><Link to="/fractional-ownership">{ar ? "تقديم ملكية جزئية" : "Apply fractional ownership"}</Link></Button>
          <Button asChild variant="secondary"><Link to="/tokenization">{ar ? "طلب ترميز عقار" : "Request tokenization"}</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/dashboard">{ar ? "دخول الإدارة" : "Open admin"}</Link></Button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>{ar ? "المسارات الموصولة" : "Connected workflows"}</h2>
            <p className={styles.sectionText}>{ar ? "كل بطاقة تفتح المسار المناسب داخل SKNAI." : "Each card opens the matching SKNAI flow."}</p>
          </div>
        </div>
        <div className={styles.grid}>
          {roles.map((role) => (
            <article className={styles.card} key={role.to}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}>{role.icon}</span>
                <h3 className={styles.cardTitle}>{ar ? role.titleAr : role.titleEn}</h3>
              </div>
              <p className={styles.cardText}>{ar ? role.textAr : role.textEn}</p>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>{ar ? "مضاف" : "Added"}</span>
                <span className={styles.badge}>{ar ? "موصول" : "Wired"}</span>
              </div>
              <div className={styles.actions}>
                <Button asChild size="sm"><Link to={role.to}>{ar ? "فتح" : "Open"}</Link></Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.grid}>
          <div className={styles.metric}><span className={styles.metricValue}>4</span><span className={styles.metricLabel}>{ar ? "لوحات أدوار" : "Role dashboards"}</span></div>
          <div className={styles.metric}><span className={styles.metricValue}>9+</span><span className={styles.metricLabel}>{ar ? "صفحات إدارة" : "Admin pages"}</span></div>
          <div className={styles.metric}><span className={styles.metricValue}>KYC</span><span className={styles.metricLabel}>{ar ? "امتثال المستثمر" : "Investor compliance"}</span></div>
          <div className={styles.metric}><span className={styles.metricValue}>SAR</span><span className={styles.metricLabel}>{ar ? "محفظة واستثمار" : "Wallet and investing"}</span></div>
        </div>
      </section>
    </div>
  );
}
