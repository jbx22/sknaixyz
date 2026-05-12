import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { AdminSubscriptionTable } from "../components/AdminSubscriptionTable";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import styles from "./admin.subscriptions.module.css";

export default function AdminSubscriptionsPage() {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet>
          <title>{t.subscriptions} | SKNAI Admin</title>
        </Helmet>

        <div className={styles.container}>
          <h1 className={styles.title}>{t.subscriptions}</h1>
          <AdminSubscriptionTable />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}