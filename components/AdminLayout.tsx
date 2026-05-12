import React, { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
};