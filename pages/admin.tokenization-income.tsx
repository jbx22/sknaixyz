import React from "react";
import { Helmet } from "react-helmet";
import { AdminRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../components/AdminLayout";
import { AdminIncomeDistributionForm } from "../components/AdminIncomeDistributionForm";
import styles from "./admin.tokenization-income.module.css";

export default function AdminIncomePage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <Helmet>
          <title>Income Distribution | SKNAI Admin</title>
        </Helmet>

        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Income Distribution</h1>
            <p className={styles.subtitle}>
              Distribute rental income or dividends to token holders.
            </p>
          </div>

          <div className={styles.content}>
            <AdminIncomeDistributionForm />
            
            {/* Future: Add distribution history table here */}
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}