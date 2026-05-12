import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileCheck2, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "../components/Button";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { addAuditLog, newId, saveApplication, SubscriptionPlan, SubscriptionUserType, userTypeLabels } from "../helpers/subscriptionCompliance";
import styles from "./sakn-flows.module.css";

const requiredDocs: Record<SubscriptionUserType, string[]> = {
  investor: ["identityFileName"],
  owner: ["identityFileName", "ownershipFileName"],
  office: ["identityFileName", "crFileName", "regaFalFileName"],
  developer: ["identityFileName", "crFileName", "authorizationFileName"],
};

export default function SubscriptionApplyPage() {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === "ar";
  const user = authState.type === "authenticated" ? authState.user : null;
  const [userType, setUserType] = useState<SubscriptionUserType>("investor");
  const [requestedPlan, setRequestedPlan] = useState<SubscriptionPlan>("free");
  const [signature, setSignature] = useState(user?.displayName || "");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    phone: "", nationalId: "", organizationName: "", crNumber: "", regaLicenseNumber: "", falLicenseNumber: "", licenseExpiry: "", responsibleManager: "",
    fullName: user?.displayName || "", idNumber: "", dateOfBirth: "", nationality: "", address: "", sourceOfFunds: "", politicallyExposed: "no",
    identityFileName: "", ownershipFileName: "", crFileName: "", regaFalFileName: "", authorizationFileName: "",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const file = (key: string, files: FileList | null) => set(key, files?.[0]?.name || "");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!acceptedRisk || !acceptedTerms || !signature.trim()) {
      toast.error(ar ? "يجب توقيع إقرار المخاطر وقبول الشروط" : "Risk acknowledgement and terms must be signed");
      return;
    }
    const missingDoc = requiredDocs[userType].find((key) => !(form as any)[key]);
    if (missingDoc) {
      toast.error(ar ? "يرجى رفع المستندات المطلوبة لنوع المستخدم" : "Please upload the required documents for this user type");
      return;
    }
    const now = new Date().toISOString();
    const application = {
      id: newId("sub"),
      userId: String(user.id),
      userEmail: user.email,
      userName: user.displayName,
      userType,
      requestedPlan,
      status: "pending_admin_review" as const,
      paymentStatus: requestedPlan === "free" ? "not_required" as const : "paid_pending_approval" as const,
      createdAt: now,
      updatedAt: now,
      applicant: {
        phone: form.phone, nationalId: form.nationalId, organizationName: form.organizationName, crNumber: form.crNumber,
        regaLicenseNumber: form.regaLicenseNumber, falLicenseNumber: form.falLicenseNumber, licenseExpiry: form.licenseExpiry, responsibleManager: form.responsibleManager,
      },
      kyc: {
        fullName: form.fullName, idNumber: form.idNumber, dateOfBirth: form.dateOfBirth, nationality: form.nationality, address: form.address, sourceOfFunds: form.sourceOfFunds,
        politicallyExposed: form.politicallyExposed as "yes" | "no",
      },
      documents: {
        identityFileName: form.identityFileName, ownershipFileName: form.ownershipFileName, crFileName: form.crFileName, regaFalFileName: form.regaFalFileName, authorizationFileName: form.authorizationFileName,
      },
      riskAcknowledgment: { accepted: acceptedRisk, signedBy: signature, signedAt: now, signatureText: `${signature} - ${now}` },
      termsAcceptance: { accepted: acceptedTerms, signedBy: signature, signedAt: now, signatureText: `${signature} - ${now}` },
    };
    saveApplication(application);
    addAuditLog({ applicationId: application.id, action: "SUBMITTED", actor: user.email, details: `Submitted ${userType} / ${requestedPlan} subscription for admin review` });
    toast.success(ar ? "تم إرسال طلب الاشتراك للمراجعة" : "Subscription application submitted for review");
    navigate("/subscription/status");
  };

  return (
    <div className={styles.page}>
      <Helmet><title>{ar ? "طلب الاشتراك" : "Subscription Application"} | SKNAI</title></Helmet>
      <section className={styles.hero}>
        <span className={styles.eyebrow}><ShieldCheck size={16} /> {ar ? "موافقة إدارية قبل التفعيل" : "Admin approval before activation"}</span>
        <h1 className={styles.title}>{ar ? "طلب اشتراك منظم حسب نوع المستخدم" : "Compliance-gated subscription application"}</h1>
        <p className={styles.subtitle}>{ar ? "المستخدم المجاني يستطيع مشاهدة القوائم. أي صلاحيات منظمة تحتاج KYC، مستندات، توقيع إلكتروني، وموافقة الإدارة." : "Free users can view listings. Regulated permissions require KYC, documents, e-signature, and admin approval."}</p>
      </section>

      <form className={styles.section} onSubmit={submit}>
        <div className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{ar ? "نوع المستخدم والخطة" : "User type and plan"}</h2>
            <label className={styles.field}><span className={styles.label}>{ar ? "نوع المستخدم" : "User type"}</span><select className={styles.select} value={userType} onChange={(e) => setUserType(e.target.value as SubscriptionUserType)}>{Object.entries(userTypeLabels).map(([key, label]) => <option key={key} value={key}>{ar ? label.ar : label.en}</option>)}</select></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "الخطة" : "Plan"}</span><select className={styles.select} value={requestedPlan} onChange={(e) => setRequestedPlan(e.target.value as SubscriptionPlan)}><option value="free">Free</option><option value="basic">Basic</option><option value="premium">Premium</option></select></label>
            <p className={styles.cardText}>{ar ? "الدفع لا يفعّل الصلاحيات وحده؛ التفعيل بعد موافقة الإدارة فقط." : "Payment alone never activates permissions; activation happens only after admin approval."}</p>
          </article>

          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>KYC</h2>
            <label className={styles.field}><span className={styles.label}>{ar ? "الاسم الكامل" : "Full name"}</span><input className={styles.input} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "رقم الهوية/الإقامة" : "ID/Iqama number"}</span><input className={styles.input} value={form.idNumber} onChange={(e) => set("idNumber", e.target.value)} required /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "تاريخ الميلاد" : "Date of birth"}</span><input className={styles.input} type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} required /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "الجنسية" : "Nationality"}</span><input className={styles.input} value={form.nationality} onChange={(e) => set("nationality", e.target.value)} required /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "العنوان" : "Address"}</span><textarea className={styles.textarea} value={form.address} onChange={(e) => set("address", e.target.value)} required /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "مصدر الأموال" : "Source of funds"}</span><input className={styles.input} value={form.sourceOfFunds} onChange={(e) => set("sourceOfFunds", e.target.value)} required /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "شخص معرض سياسياً؟" : "Politically exposed person?"}</span><select className={styles.select} value={form.politicallyExposed} onChange={(e) => set("politicallyExposed", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></label>
          </article>

          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{ar ? "بيانات الترخيص حسب النوع" : "Type-specific licensing"}</h2>
            <label className={styles.field}><span className={styles.label}>{ar ? "رقم الجوال" : "Phone"}</span><input className={styles.input} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "اسم المنشأة" : "Organization name"}</span><input className={styles.input} value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "السجل التجاري" : "Commercial registration"}</span><input className={styles.input} value={form.crNumber} onChange={(e) => set("crNumber", e.target.value)} /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "رقم رخصة REGA" : "REGA license number"}</span><input className={styles.input} value={form.regaLicenseNumber} onChange={(e) => set("regaLicenseNumber", e.target.value)} /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "رقم رخصة فال" : "FAL license number"}</span><input className={styles.input} value={form.falLicenseNumber} onChange={(e) => set("falLicenseNumber", e.target.value)} /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "انتهاء الرخصة" : "License expiry"}</span><input className={styles.input} type="date" value={form.licenseExpiry} onChange={(e) => set("licenseExpiry", e.target.value)} /></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "المدير المسؤول" : "Responsible manager"}</span><input className={styles.input} value={form.responsibleManager} onChange={(e) => set("responsibleManager", e.target.value)} /></label>
          </article>

          <article className={styles.card}>
            <h2 className={styles.sectionTitle}><UploadCloud size={20} /> {ar ? "المستندات" : "Documents"}</h2>
            {[['identityFileName', ar ? 'الهوية' : 'Identity'], ['ownershipFileName', ar ? 'صك/إثبات ملكية' : 'Ownership proof'], ['crFileName', ar ? 'السجل التجاري' : 'Commercial registration'], ['regaFalFileName', ar ? 'رخصة REGA/FAL' : 'REGA/FAL license'], ['authorizationFileName', ar ? 'تفويض/اعتماد مشروع' : 'Authorization/project approval']].map(([key, label]) => (
              <label className={styles.field} key={key}><span className={styles.label}>{label}</span><input className={styles.input} type="file" onChange={(e) => file(key, e.target.files)} /><small className={styles.cardText}>{(form as any)[key]}</small></label>
            ))}
          </article>

          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{ar ? "إقرار المخاطر" : "Risk acknowledgement"}</h2>
            <p className={styles.cardText}>{ar ? "أقر بأن الاستثمار العقاري والملكية الجزئية والترميز قد تتضمن مخاطر سوقية وتنظيمية وسيولة، وأن الموافقة الإدارية لا تمثل ضمان ربح." : "I acknowledge real-estate investing, fractional ownership, and tokenization may include market, regulatory, and liquidity risks, and admin approval is not a profit guarantee."}</p>
            <label className={styles.field}><span><input type="checkbox" checked={acceptedRisk} onChange={(e) => setAcceptedRisk(e.target.checked)} /> {ar ? "أوافق وأوقع إلكترونياً" : "I agree and e-sign"}</span></label>
          </article>

          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>{ar ? "قبول الشروط" : "Terms acceptance"}</h2>
            <p className={styles.cardText}>{ar ? "أقبل شروط SKNAI وسياسات الخصوصية والامتثال، وأفهم أن الإدارة تستطيع طلب تعديلات أو رفض أو تعليق الاشتراك." : "I accept SKNAI terms, privacy, and compliance policies, and understand admin may request changes, reject, or suspend the subscription."}</p>
            <label className={styles.field}><span><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} /> {ar ? "أقبل الشروط وأوقع إلكترونياً" : "I accept terms and e-sign"}</span></label>
            <label className={styles.field}><span className={styles.label}>{ar ? "التوقيع الإلكتروني" : "E-signature"}</span><input className={styles.input} value={signature} onChange={(e) => setSignature(e.target.value)} required /></label>
            <Button type="submit"><FileCheck2 size={16} /> {ar ? "إرسال للمراجعة" : "Submit for approval"}</Button>
          </article>
        </div>
      </form>
    </div>
  );
}
