import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { AdminPropertyTable } from "../components/AdminPropertyTable";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import styles from "./admin.properties.module.css";

export default function AdminPropertiesPage() {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet>
          <title>{t.properties} | SKNAI Admin</title>
        </Helmet>

        <div className={styles.container}>
          <h1 className={styles.title}>{t.properties}</h1>
          <AdminPropertyTable />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}