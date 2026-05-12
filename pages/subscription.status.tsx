import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Clock, FileCheck2, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { getLatestApplicationForUser, readAuditLogs, statusLabels, userTypeLabels } from "../helpers/subscriptionCompliance";
import styles from "./sakn-flows.module.css";

export default function SubscriptionStatusPage() {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const ar = language === "ar";
  const user = authState.type === "authenticated" ? authState.user : null;
  const application = useMemo(() => getLatestApplicationForUser(user ? String(user.id) : undefined, user?.email), [user]);
  const logs = useMemo(() => readAuditLogs().filter((log) => log.applicationId === application?.id), [application?.id]);

  return (
    <div className={styles.page}>
      <Helmet><title>{ar ? "حالة الاشتراك" : "Subscription Status"} | SKNAI</title></Helmet>
      <section className={styles.hero}>
        <span className={styles.eyebrow}><Clock size={16} /> {ar ? "متابعة الموافقة" : "Approval tracking"}</span>
        <h1 className={styles.title}>{ar ? "حالة الاشتراك والامتثال" : "Subscription and compliance status"}</h1>
        <p className={styles.subtitle}>{ar ? "القوائم متاحة للمستخدمين المجانيين. الصلاحيات المنظمة تظهر بعد موافقة الإدارة." : "Listings remain available to free users. Regulated permissions unlock only after admin approval."}</p>
      </section>

      {!application ? (
        <article className={styles.card}>
          <h2 className={styles.sectionTitle}>{ar ? "لا يوجد طلب بعد" : "No application yet"}</h2>
          <p className={styles.cardText}>{ar ? "ابدأ طلب الاشتراك لتعبئة KYC والتوقيع الإلكتروني ورفع المستندات." : "Start a subscription application to complete KYC, e-signature, and document upload."}</p>
          <div className={styles.actions}><Button asChild><Link to="/subscription/apply">{ar ? "بدء الطلب" : "Start application"}</Link></Button></div>
        </article>
      ) : (
        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.icon}><ShieldCheck size={20} /></span><h2 className={styles.cardTitle}>{ar ? "الحالة الحالية" : "Current status"}</h2></div>
            <div className={styles.metrics}>
              <div className={styles.metric}><span className={styles.metricValue}>{ar ? statusLabels[application.status].ar : statusLabels[application.status].en}</span><span className={styles.metricLabel}>{ar ? "الحالة" : "Status"}</span></div>
              <div className={styles.metric}><span className={styles.metricValue}>{ar ? userTypeLabels[application.userType].ar : userTypeLabels[application.userType].en}</span><span className={styles.metricLabel}>{ar ? "نوع المستخدم" : "User type"}</span></div>
              <div className={styles.metric}><span className={styles.metricValue}>{application.requestedPlan}</span><span className={styles.metricLabel}>{ar ? "الخطة" : "Plan"}</span></div>
            </div>
            {application.adminNotes && <p className={styles.sectionText}><strong>{ar ? "ملاحظات الإدارة:" : "Admin notes:"}</strong> {application.adminNotes}</p>}
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}><span className={styles.icon}><FileCheck2 size={20} /></span><h2 className={styles.cardTitle}>{ar ? "التوقيعات والمستندات" : "Signatures and documents"}</h2></div>
            <div className={styles.timeline}>
              <div className={styles.step}><span className={styles.stepNumber}>1</span><p className={styles.cardText}>KYC: {application.kyc.fullName} / {application.kyc.idNumber}</p></div>
              <div className={styles.step}><span className={styles.stepNumber}>2</span><p className={styles.cardText}>{ar ? "إقرار المخاطر موقع بواسطة" : "Risk signed by"}: {application.riskAcknowledgment.signedBy}</p></div>
              <div className={styles.step}><span className={styles.stepNumber}>3</span><p className={styles.cardText}>{ar ? "الشروط موقعة بواسطة" : "Terms signed by"}: {application.termsAcceptance.signedBy}</p></div>
              <div className={styles.step}><span className={styles.stepNumber}>4</span><p className={styles.cardText}>{ar ? "المستندات:" : "Documents:"} {Object.values(application.documents).filter(Boolean).join(", ") || "—"}</p></div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>{ar ? "سجل التدقيق" : "Audit log"}</h2>
            <div className={styles.timeline}>
              {logs.length === 0 ? <p className={styles.cardText}>{ar ? "لا توجد أحداث بعد." : "No events yet."}</p> : logs.map((log, index) => (
                <div className={styles.step} key={log.id}><span className={styles.stepNumber}>{index + 1}</span><div><strong>{log.action}</strong><p className={styles.cardText}>{log.details}</p><small>{new Date(log.at).toLocaleString(ar ? "ar-SA" : "en-US")} · {log.actor}</small></div></div>
              ))}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
