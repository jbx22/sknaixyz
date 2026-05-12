import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { AdminStats } from "../components/AdminStats";
import { AdminActivityLog } from "../components/AdminActivityLog";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { Button } from "../components/Button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import styles from "./admin.dashboard.module.css";

export default function AdminDashboardPage() {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];

  const isRtl = language === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet>
          <title>{t.dashboard} | SKNAI Admin</title>
        </Helmet>

        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{t.dashboard}</h1>
            <p className={styles.subtitle}>{t.messages.welcome}</p>
          </div>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.statistics}</h2>
            <AdminStats />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t.stats.recentActivity}</h2>
              <Button variant="link" asChild className={styles.viewAllLink}>
                <Link to="/admin/activity">
                  {t.actions.viewAll} <ArrowIcon size={16} />
                </Link>
              </Button>
            </div>
            <div className={styles.card}>
              <AdminActivityLog limit={5} showFilters={false} />
            </div>
          </section>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}