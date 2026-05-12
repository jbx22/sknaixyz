import React from "react";
import { Helmet } from "react-helmet";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { AdminKycTable } from "../components/AdminKycTable";
import styles from "./admin.tokenization-kyc.module.css";

export default function AdminKycPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet>
          <title>KYC Management | SKNAI Admin</title>
        </Helmet>

        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>KYC Management</h1>
            <p className={styles.subtitle}>
              Review and approve investor KYC applications.
            </p>
          </div>

          <AdminKycTable />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}