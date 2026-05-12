import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, Percent, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/Button";
import { ComplianceGate } from "../components/ComplianceGate";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { emptyRegaChecklist, regaRules, saveFractionalRequest, addWorkflowAudit, workflowId } from "../helpers/assetWorkflows";
import styles from "./sakn-flows.module.css";

export default function FractionalOwnershipPage() {
  const { language } = useLanguage();
  const { authState } = useAuth();
  const ar = language === "ar";
  const user = authState.type === "authenticated" ? authState.user : null;
  const [form, setForm] = useState({ applicantType: "owner", propertyTitle: "", city: "Riyadh", estimatedValue: "", fractionalPercent: "25%", targetRaise: "", minimumTicket: "1000", incomeModel: "Rental income distribution", useOfFunds: "", exitPlan: "Secondary market or asset sale", riskSummary: "", docs: "", falLicenseNumber: "", regaAdLicenseNumber: "", brokerageContractNumber: "", ownershipDocumentNumber: "", responsibleOfficer: "", marketingScopeConfirmed: false, adChannelsConfirmed: false, disclosuresAccepted: false });
  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.marketingScopeConfirmed || !form.adChannelsConfirmed || !form.disclosuresAccepted) {
      toast.error(ar ? "يرجى تأكيد متطلبات الترخيص والإفصاح قبل الإرسال" : "Please confirm licensing and disclosure requirements before submitting");
      return;
    }
    const now = new Date().toISOString();
    const request = {
      id: workflowId("frac"), applicantName: user?.displayName || "Demo Applicant", applicantEmail: user?.email || "demo@sknai.test", applicantType: form.applicantType as any,
      propertyTitle: form.propertyTitle || (ar ? "عقار ملكية جزئية" : "Fractional property"), city: form.city, estimatedValue: form.estimatedValue, fractionalPercent: form.fractionalPercent, targetRaise: form.targetRaise, minimumTicket: form.minimumTicket, incomeModel: form.incomeModel, useOfFunds: form.useOfFunds, exitPlan: form.exitPlan, riskSummary: form.riskSummary,
      documents: form.docs.split(",").map((d) => d.trim()).filter(Boolean),
      rega: { ...emptyRegaChecklist(), falLicenseNumber: form.falLicenseNumber, regaAdLicenseNumber: form.regaAdLicenseNumber, brokerageContractNumber: form.brokerageContractNumber, ownershipDocumentNumber: form.ownershipDocumentNumber, responsibleOfficer: form.responsibleOfficer, marketingScopeConfirmed: form.marketingScopeConfirmed, adChannelsConfirmed: form.adChannelsConfirmed, disclosuresAccepted: form.disclosuresAccepted },
      status: "pending_admin_review" as const, createdAt: now, updatedAt: now,
    };
    saveFractionalRequest(request);
    addWorkflowAudit({ workflow: "fractional", targetId: request.id, actor: request.applicantEmail, action: "SUBMITTED", details: "Fractional ownership request submitted with REGA/FAL checklist" });
    toast.success(ar ? "تم إرسال طلب الملكية الجزئية للمراجعة" : "Fractional ownership request submitted for admin review");
  };

  return <div className={styles.page}>
    <Helmet><title>{ar ? "الملكية الجزئية" : "Fractional Ownership"} | SKNAI</title></Helmet>
    <section className={styles.hero}><span className={styles.eyebrow}><Percent size={16} /> {ar ? "ملكية جزئية منظمة" : "Regulated fractional ownership"}</span><h1 className={styles.title}>{ar ? "مسار الملكية الجزئية وفق ضوابط REGA" : "Fractional ownership flow with REGA-aware controls"}</h1><p className={styles.subtitle}>{ar ? "قبل طرح أي أصل: تحقق رخصة فال/ريغا، عقد التسويق/الوساطة، صك الملكية، إفصاحات المخاطر، وموافقة الإدارة." : "Before any asset is offered: verify FAL/REGA license, brokerage/marketing contract, ownership document, risk disclosures, and admin approval."}</p><div className={styles.actions}><Button asChild><Link to="/admin/fractional-ownership">{ar ? "لوحة الإدارة" : "Admin board"}</Link></Button><Button asChild variant="outline"><Link to="/secondary-market">{ar ? "السوق الثانوية" : "Secondary market"}</Link></Button></div></section>
    <section className={styles.section}><div className={styles.grid}>{regaRules.map((rule, i) => <article className={styles.card} key={rule}><div className={styles.cardHeader}><span className={styles.icon}><ShieldCheck size={20}/></span><h3 className={styles.cardTitle}>{ar ? `بوابة امتثال ${i+1}` : `Compliance gate ${i+1}`}</h3></div><p className={styles.cardText}>{rule}</p></article>)}</div></section>
    <section className={styles.section}><ComplianceGate featureName={ar ? "طلب الملكية الجزئية" : "Fractional ownership application"}><form className={styles.form} onSubmit={submit}><div className={styles.grid}>
      <article className={styles.card}><h2 className={styles.sectionTitle}>{ar ? "بيانات الأصل" : "Asset details"}</h2>{[["propertyTitle", ar ? "اسم العقار" : "Property title"],["city", ar ? "المدينة" : "City"],["estimatedValue", ar ? "القيمة التقديرية" : "Estimated value"],["fractionalPercent", ar ? "نسبة الملكية المطروحة" : "Fraction offered"],["targetRaise", ar ? "المبلغ المستهدف" : "Target raise"],["minimumTicket", ar ? "الحد الأدنى للاستثمار" : "Minimum ticket"]].map(([k,l]) => <label className={styles.field} key={k}><span className={styles.label}>{l}</span><input className={styles.input} value={(form as any)[k]} onChange={(e)=>set(k,e.target.value)} /></label>)}</article>
      <article className={styles.card}><h2 className={styles.sectionTitle}>{ar ? "النموذج والمخاطر" : "Economics and risk"}</h2>{[["incomeModel", ar ? "نموذج الدخل" : "Income model"],["useOfFunds", ar ? "استخدام الأموال" : "Use of funds"],["exitPlan", ar ? "خطة الخروج" : "Exit plan"]].map(([k,l]) => <label className={styles.field} key={k}><span className={styles.label}>{l}</span><input className={styles.input} value={(form as any)[k]} onChange={(e)=>set(k,e.target.value)} /></label>)}<label className={styles.field}><span className={styles.label}>{ar ? "ملخص المخاطر" : "Risk summary"}</span><textarea className={styles.textarea} value={form.riskSummary} onChange={(e)=>set("riskSummary",e.target.value)} /></label></article>
      <article className={styles.card}><h2 className={styles.sectionTitle}><FileText size={20}/> {ar ? "REGA/FAL" : "REGA/FAL checklist"}</h2>{[["falLicenseNumber", "FAL / REGA license #"],["regaAdLicenseNumber", "Real-estate ad license #"],["brokerageContractNumber", "Brokerage/marketing contract #"],["ownershipDocumentNumber", "Ownership deed/document #"],["responsibleOfficer", "Responsible officer"]].map(([k,l]) => <label className={styles.field} key={k}><span className={styles.label}>{l}</span><input className={styles.input} value={(form as any)[k]} onChange={(e)=>set(k,e.target.value)} /></label>)}{[["marketingScopeConfirmed", "License scope confirmed"],["adChannelsConfirmed", "Advertising channels confirmed"],["disclosuresAccepted", "Risk/disclosure pack accepted"]].map(([k,l]) => <label className={styles.field} key={k}><span><input type="checkbox" checked={(form as any)[k]} onChange={(e)=>set(k,e.target.checked)} /> {l}</span></label>)}</article>
      <article className={styles.card}><h2 className={styles.sectionTitle}><UploadCloud size={20}/> {ar ? "المستندات" : "Documents"}</h2><label className={styles.field}><span className={styles.label}>{ar ? "أسماء الملفات مفصولة بفواصل" : "File names, comma-separated"}</span><textarea className={styles.textarea} value={form.docs} onChange={(e)=>set("docs",e.target.value)} placeholder="title-deed.pdf, valuation.pdf, fal-license.pdf" /></label><Button type="submit"><CheckCircle2 size={16}/> {ar ? "إرسال للمراجعة" : "Submit for review"}</Button></article>
    </div></form></ComplianceGate></section>
  </div>;
}
