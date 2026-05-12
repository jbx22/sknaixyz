import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { AdminActivityLog } from "../components/AdminActivityLog";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import styles from "./admin.activity.module.css";

export default function AdminActivityPage() {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet>
          <title>{t.activityLogs} | SKNAI Admin</title>
        </Helmet>

        <div className={styles.container}>
          <h1 className={styles.title}>{t.activityLogs}</h1>
          <AdminActivityLog />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}