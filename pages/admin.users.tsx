import React from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { AdminUserTable } from "../components/AdminUserTable";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import styles from "./admin.users.module.css";

export default function AdminUsersPage() {
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];

  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet>
          <title>{t.users} | SKNAI Admin</title>
        </Helmet>

        <div className={styles.container}>
          <h1 className={styles.title}>{t.users}</h1>
          <AdminUserTable />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}