import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { CheckCircle2, ClipboardCheck, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { Button } from "../components/Button";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { addAuditLog, readApplications, readAuditLogs, saveApplication, statusLabels, SubscriptionApplication, userTypeLabels } from "../helpers/subscriptionCompliance";
import styles from "./sakn-flows.module.css";

export default function AdminSubscriptionApprovalsPage() {
  const { language } = useLanguage();
  const { authState } = useAuth();
  const ar = language === "ar";
  const admin = authState.type === "authenticated" ? authState.user.email : "admin";
  const [applications, setApplications] = useState<SubscriptionApplication[]>(() => readApplications());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const auditLogs = useMemo(() => readAuditLogs(), [applications]);

  const reload = () => setApplications(readApplications());
  const update = (application: SubscriptionApplication, status: SubscriptionApplication["status"], action: string) => {
    const updated = { ...application, status, adminNotes: notes[application.id] || application.adminNotes, updatedAt: new Date().toISOString() };
    if (status === "approved_active") {
      updated.approvedBy = admin;
      updated.approvedAt = new Date().toISOString();
    }
    saveApplication(updated);
    addAuditLog({ applicationId: application.id, action, actor: admin, details: `${action}: ${notes[application.id] || "No notes"}` });
    reload();
  };

  return (
    <div className={styles.page}>
      <Helmet><title>{ar ? "موافقات الاشتراكات" : "Subscription Approvals"} | SKNAI Admin</title></Helmet>
      <section className={styles.hero}>
        <span className={styles.eyebrow}><ClipboardCheck size={16} /> {ar ? "لوحة موافقة إدارية" : "Admin approval dashboard"}</span>
        <h1 className={styles.title}>{ar ? "مراجعة اشتراكات المستخدمين" : "Review user subscription applications"}</h1>
        <p className={styles.subtitle}>{ar ? "راجع KYC والمستندات والتوقيعات. الدفع وحده لا يفعّل صلاحيات المستخدم حتى الموافقة." : "Review KYC, documents, and e-signatures. Payment alone does not activate user permissions until approval."}</p>
        <div className={styles.actions}><Button type="button" onClick={reload} variant="secondary"><RefreshCw size={16} /> {ar ? "تحديث" : "Refresh"}</Button></div>
      </section>

      <section className={styles.section}>
        <div className={styles.grid}>
          {applications.length === 0 ? <article className={styles.card}><h2 className={styles.cardTitle}>{ar ? "لا توجد طلبات" : "No applications"}</h2><p className={styles.cardText}>{ar ? "ستظهر طلبات الاشتراك هنا بعد إرسالها من المستخدمين." : "Submitted subscription applications will appear here."}</p></article> : applications.map((app) => {
            const appLogs = auditLogs.filter((log) => log.applicationId === app.id).slice(0, 4);
            return (
              <article className={styles.card} key={app.id}>
                <div className={styles.cardHeader}><span className={styles.icon}><ClipboardCheck size={20} /></span><div><h2 className={styles.cardTitle}>{app.userName || app.userEmail}</h2><p className={styles.cardText}>{app.userEmail}</p></div></div>
                <div className={styles.metrics}>
                  <div className={styles.metric}><span className={styles.metricValue}>{ar ? userTypeLabels[app.userType].ar : userTypeLabels[app.userType].en}</span><span className={styles.metricLabel}>{ar ? "النوع" : "Type"}</span></div>
                  <div className={styles.metric}><span className={styles.metricValue}>{app.requestedPlan}</span><span className={styles.metricLabel}>{ar ? "الخطة" : "Plan"}</span></div>
                  <div className={styles.metric}><span className={styles.metricValue}>{ar ? statusLabels[app.status].ar : statusLabels[app.status].en}</span><span className={styles.metricLabel}>{ar ? "الحالة" : "Status"}</span></div>
                </div>

                <h3 className={styles.cardTitle}>KYC</h3>
                <p className={styles.cardText}>{app.kyc.fullName} · {app.kyc.idNumber} · {app.kyc.nationality}</p>
                <p className={styles.cardText}>{ar ? "مصدر الأموال" : "Source of funds"}: {app.kyc.sourceOfFunds || "—"} · PEP: {app.kyc.politicallyExposed}</p>

                <h3 className={styles.cardTitle}>{ar ? "الترخيص والمستندات" : "Licensing and documents"}</h3>
                <p className={styles.cardText}>REGA: {app.applicant.regaLicenseNumber || "—"} · FAL: {app.applicant.falLicenseNumber || "—"} · CR: {app.applicant.crNumber || "—"}</p>
                <div className={styles.badgeRow}>{Object.values(app.documents).filter(Boolean).map((name) => <span className={styles.badge} key={name}>{name}</span>)}</div>

                <h3 className={styles.cardTitle}>{ar ? "التوقيعات" : "Signatures"}</h3>
                <p className={styles.cardText}>{ar ? "المخاطر" : "Risk"}: {app.riskAcknowledgment.signatureText}</p>
                <p className={styles.cardText}>{ar ? "الشروط" : "Terms"}: {app.termsAcceptance.signatureText}</p>

                <label className={styles.field}><span className={styles.label}>{ar ? "ملاحظات الإدارة" : "Admin notes"}</span><textarea className={styles.textarea} value={notes[app.id] ?? app.adminNotes ?? ""} onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))} /></label>
                <div className={styles.actions}>
                  <Button type="button" onClick={() => update(app, "approved_active", "APPROVED")}><CheckCircle2 size={16} /> {ar ? "موافقة وتفعيل" : "Approve & activate"}</Button>
                  <Button type="button" variant="secondary" onClick={() => update(app, "changes_requested", "CHANGES_REQUESTED")}><RotateCcw size={16} /> {ar ? "طلب تعديلات" : "Request changes"}</Button>
                  <Button type="button" variant="destructive" onClick={() => update(app, "rejected", "REJECTED")}><XCircle size={16} /> {ar ? "رفض" : "Reject"}</Button>
                </div>

                <h3 className={styles.cardTitle}>{ar ? "آخر سجل تدقيق" : "Recent audit"}</h3>
                <div className={styles.timeline}>{appLogs.map((log, index) => <div className={styles.step} key={log.id}><span className={styles.stepNumber}>{index + 1}</span><p className={styles.cardText}><strong>{log.action}</strong> · {log.details}</p></div>)}</div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
