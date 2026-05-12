import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "./Button";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { getLatestApplicationForUser } from "../helpers/subscriptionCompliance";
import styles from "../pages/sakn-flows.module.css";

interface ComplianceGateProps {
  children: React.ReactNode;
  featureName?: string;
}

export function ComplianceGate({ children, featureName }: ComplianceGateProps) {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const ar = language === "ar";
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (authState.type !== "authenticated") {
      setApproved(false);
      return;
    }
    const application = getLatestApplicationForUser(String(authState.user.id), authState.user.email);
    setApproved(application?.status === "approved_active");
  }, [authState]);

  if (authState.type !== "authenticated") {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}><span className={styles.icon}><LockKeyhole size={20} /></span><h3 className={styles.cardTitle}>{ar ? "تسجيل الدخول مطلوب" : "Login required"}</h3></div>
        <p className={styles.cardText}>{ar ? "يمكن للزوار مشاهدة القوائم مجاناً، لكن الإجراءات المنظمة تتطلب حساباً وموافقة إدارية." : "Visitors can view listings for free, but regulated actions require an account and admin approval."}</p>
        <div className={styles.actions}><Button asChild><Link to="/login">{ar ? "تسجيل الدخول" : "Login"}</Link></Button></div>
      </div>
    );
  }

  if (!approved) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}><span className={styles.icon}><ShieldCheck size={20} /></span><h3 className={styles.cardTitle}>{ar ? "موافقة الاشتراك مطلوبة" : "Subscription approval required"}</h3></div>
        <p className={styles.cardText}>
          {ar
            ? `ميزة ${featureName || "هذه الخدمة"} مقفلة حتى تعبئة KYC، إقرار المخاطر، قبول الشروط، رفع المستندات، ثم موافقة الإدارة. الدفع وحده لا يفعّل الصلاحيات.`
            : `${featureName || "This feature"} is locked until KYC, risk acknowledgement, terms acceptance, document upload, and admin approval are complete. Payment alone never activates permissions.`}
        </p>
        <div className={styles.actions}>
          <Button asChild><Link to="/subscription/apply">{ar ? "تقديم طلب الاشتراك" : "Apply for subscription"}</Link></Button>
          <Button asChild variant="outline"><Link to="/subscription/status">{ar ? "متابعة الحالة" : "Check status"}</Link></Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
