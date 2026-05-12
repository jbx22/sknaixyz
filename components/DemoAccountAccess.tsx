import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { postLogin } from "../endpoints/auth/login_with_password_POST.schema";
import { useAuth } from "../helpers/useAuth";
import { DEMO_ACCOUNTS, seedDemoComplianceForUser } from "../helpers/demoAccounts";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./DemoAccountAccess.module.css";

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
      const result = await postLogin({ email, password });
      seedDemoComplianceForUser(result.user);
      onLogin(result.user);
      toast.success(ar ? "تم تسجيل الدخول بحساب تجريبي" : "Logged in with demo account");
      setTimeout(() => navigate("/"), 150);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demo login failed");
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div className={styles.demoPanel}>
      <div className={styles.header}>
        <strong>{ar ? "دخول تجريبي سريع" : "Quick demo access"}</strong>
        <span>{ar ? "كلمة المرور لكل الحسابات: demo123" : "All passwords: demo123"}</span>
      </div>
      <div className={styles.grid}>
        {DEMO_ACCOUNTS.filter((a) => a.role !== "admin" && a.role !== "superadmin").map((account) => (
          <Button
            key={account.email}
            type="button"
            variant="outline"
            size="sm"
            className={styles.demoButton}
            disabled={!!loadingEmail}
            onClick={() => loginAs(account.email, account.password)}
          >
            {loadingEmail === account.email ? <Spinner size="sm" /> : null}
            <span>{ar ? account.arLabel : account.label}</span>
            <small>{account.email}</small>
          </Button>
        ))}
      </div>
    </div>
  );
}
