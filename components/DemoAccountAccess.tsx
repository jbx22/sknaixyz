import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { useAuth } from "../helpers/useAuth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDemoComplianceForUser } from "../helpers/demoAccounts";
import { User } from "../helpers/User";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./DemoAccountAccess.module.css";

const ROLE_ICONS: Record<string, string> = {
  user: "👤",
  investor: "💰",
  owner: "🏠",
  broker: "🤝",
  developer: "🏗️",
  admin: "🛡️",
  superadmin: "👑",
};

const ROLE_COLORS: Record<string, string> = {
  investor: "#10b981",
  owner: "#3b82f6",
  broker: "#f59e0b",
  developer: "#8b5cf6",
  admin: "#ef4444",
  superadmin: "#7c3aed",
};

export function DemoAccountAccess() {
  const { onLogin } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const ar = language === "ar";

  const demoUiEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === "true";
  if (!demoUiEnabled) return null;

  const loginAs = async (email: string, password: string) => {
    setLoadingEmail(email);
    try {
      let user: User;
      if (import.meta.env.DEV) {
        if (password !== DEMO_PASSWORD) throw new Error(ar ? "كلمة المرور غير صحيحة" : "Invalid demo password");
        const demo = DEMO_ACCOUNTS.find((a) => a.email === email);
        if (!demo) throw new Error(ar ? "الحساب التجريبي غير موجود" : "Demo account not found");
        user = {
          id: 9000 + DEMO_ACCOUNTS.indexOf(demo),
          email: demo.email,
          displayName: demo.label,
          avatarUrl: null,
          role: demo.role as "admin" | "user" | "superadmin",
          subscriptionTier: "premium" as const,
        };
      } else {
        const { postLogin } = await import("../endpoints/auth/login_with_password_POST.schema");
        const result = await postLogin({ email, password });
        user = result.user;
      }
      seedDemoComplianceForUser(user);
      onLogin(user);
      toast.success(ar ? "تم تسجيل الدخول بحساب تجريبي" : "Logged in with demo account");
      setTimeout(() => navigate("/"), 150);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (ar ? "فشل تسجيل الدخول" : "Demo login failed"));
    } finally {
      setLoadingEmail(null);
    }
  };

  // Categorize accounts
  const userAccounts = DEMO_ACCOUNTS.filter((a) => a.role === "user");
  const adminAccounts = DEMO_ACCOUNTS.filter((a) => a.role !== "user");

  return (
    <div className={styles.demoPanel}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <span className={styles.headerIcon}>⚡</span>
          <strong>{ar ? "دخول تجريبي سريع" : "Quick Demo Access"}</strong>
        </div>
        <span className={styles.passwordHint}>
          {ar ? "🔑 كلمة المرور: demo123" : "🔑 Password: demo123"}
        </span>
      </div>

      <div className={styles.sectionLabel}>
        {ar ? "حسابات المستخدمين" : "User Accounts"}
      </div>
      <div className={styles.grid}>
        {userAccounts.map((account) => {
          const role = account.role as string;
          const icon = ROLE_ICONS[account.email.includes("investor") ? "investor" : account.email.includes("owner") ? "owner" : account.email.includes("broker") ? "broker" : "developer"] || ROLE_ICONS.user;
          const color = ROLE_COLORS[account.email.includes("investor") ? "investor" : account.email.includes("owner") ? "owner" : account.email.includes("broker") ? "broker" : "developer"] || "#6b7280";
          return (
            <button
              key={account.email}
              type="button"
              className={styles.demoButton}
              style={{ "--role-color": color } as React.CSSProperties}
              disabled={!!loadingEmail}
              onClick={() => loginAs(account.email, account.password)}
            >
              {loadingEmail === account.email ? <Spinner size="sm" /> : <span className={styles.roleIcon}>{icon}</span>}
              <span className={styles.buttonContent}>
                <span className={styles.buttonLabel}>{ar ? account.arLabel : account.label}</span>
                <span className={styles.buttonEmail}>{account.email}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>
        {ar ? "حسابات الإدارة" : "Admin Accounts"}
      </div>
      <div className={styles.grid}>
        {adminAccounts.map((account) => {
          const icon = account.role === "superadmin" ? ROLE_ICONS.superadmin : ROLE_ICONS.admin;
          const color = account.role === "superadmin" ? ROLE_COLORS.superadmin : ROLE_COLORS.admin;
          return (
            <button
              key={account.email}
              type="button"
              className={styles.demoButton}
              style={{ "--role-color": color } as React.CSSProperties}
              disabled={!!loadingEmail}
              onClick={() => loginAs(account.email, account.password)}
            >
              {loadingEmail === account.email ? <Spinner size="sm" /> : <span className={styles.roleIcon}>{icon}</span>}
              <span className={styles.buttonContent}>
                <span className={styles.buttonLabel}>{ar ? account.arLabel : account.label}</span>
                <span className={styles.buttonEmail}>{account.email}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
