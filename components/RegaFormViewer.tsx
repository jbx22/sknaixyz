import React, { useMemo } from "react";
import { useLanguage } from "../helpers/useLanguage";
import { 
  getFormById, 
  formTypeLabels, 
  statusLabels,
  FormType,
  KYCForm,
  RiskAcknowledgmentForm,
  SubscriptionTermsForm,
  PropertyListingForm
} from "../helpers/regaForms";
import { Button } from "./Button";
import styles from "./RegaFormViewer.module.css";

interface RegaFormViewerProps {
  formId: string;
  onClose?: () => void;
  showHeader?: boolean;
  className?: string;
}

export const RegaFormViewer: React.FC<RegaFormViewerProps> = ({ 
  formId, 
  onClose, 
  showHeader = true,
  className = ""
}) => {
  const { language } = useLanguage();
  const t = formTypeLabels[language];
  const isArabic = language === "ar";
  
  const form = useMemo(() => {
    const formData = getFormById(formId);
    if (!formData) return null;
    
    // Parse formData based on formType
    let parsedFormData: KYCForm | RiskAcknowledgmentForm | SubscriptionTermsForm | PropertyListingForm | null = null;
    try {
      parsedFormData = JSON.parse(formData.formData as any);
    } catch {
      parsedFormData = formData.formData as any;
    }
    
    return {
      ...formData,
      parsedFormData,
    };
  }, [formId]);

  if (!form) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.error}>
          {isArabic ? "النموذج غير موجود" : "Form not found"}
        </div>
      </div>
    );
  }

  const renderKYCForm = (formData: KYCForm) => (
    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>
        {isArabic ? "معلومات العميل (KYC)" : "Customer Information (KYC)"}
      </h3>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>{isArabic ? "الاسم الكامل" : "Full Name"}</label>
          <div className={styles.fieldValue}>{formData.fullName || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "رقم الهوية الوطنية" : "National ID Number"}</label>
          <div className={styles.fieldValue}>{formData.idNumber || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "تاريخ الميلاد" : "Date of Birth"}</label>
          <div className={styles.fieldValue}>{formData.dateOfBirth || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "الجنسية" : "Nationality"}</label>
          <div className={styles.fieldValue}>{formData.nationality || "-"}</div>
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label>{isArabic ? "العنوان" : "Address"}</label>
          <div className={styles.fieldValue}>{formData.address || "-"}</div>
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label>{isArabic ? "مصدر الأموال" : "Source of Funds"}</label>
          <div className={styles.fieldValue}>{formData.sourceOfFunds || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "شخص معرض سياسياً (PEP)" : "Politically Exposed Person"}</label>
          <div className={styles.fieldValue}>
            {formData.politicallyExposed === "yes" 
              ? (isArabic ? "نعم" : "Yes") 
              : (isArabic ? "لا" : "No")}
          </div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "مستند الهوية" : "ID Document"}</label>
          <div className={styles.fieldValue}>{formData.idDocumentUpload || "-"}</div>
        </div>
      </div>
    </div>
  );

  const renderRiskAcknowledgmentForm = (formData: RiskAcknowledgmentForm) => (
    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>
        {isArabic ? "إقرار المخاطر" : "Risk Acknowledgment"}
      </h3>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.investmentRiskDisclosure} readOnly />
            <span>{isArabic ? "إقرار المخاطر الاستثمارية" : "Investment Risk Disclosure"}</span>
          </label>
        </div>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.marketRiskWarning} readOnly />
            <span>{isArabic ? "تحذير مخاطر السوق" : "Market Risk Warning"}</span>
          </label>
        </div>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.liquidityRiskAcknowledgment} readOnly />
            <span>{isArabic ? "إقرار مخاطر السيولة" : "Liquidity Risk Acknowledgment"}</span>
          </label>
        </div>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.regulatoryRiskAcknowledgment} readOnly />
            <span>{isArabic ? "إقرار المخاطر التنظيمية" : "Regulatory Risk Acknowledgment"}</span>
          </label>
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label>{isArabic ? "توقيع القبول" : "Signed Acceptance"}</label>
          <div className={styles.fieldValue}>
            {formData.signedAcceptance 
              ? `${formData.signatureText || "-"} (${formData.signedBy || "-"} - ${formData.signedAt || "-"})`
              : (isArabic ? "غير مُوقَّع" : "Not Signed")}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubscriptionTermsForm = (formData: SubscriptionTermsForm) => (
    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>
        {isArabic ? "شروط الاشتراك" : "Subscription Terms"}
      </h3>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.platformTerms} readOnly />
            <span>{isArabic ? "شروط المنصة" : "Platform Terms"}</span>
          </label>
        </div>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.regaCompliance} readOnly />
            <span>{isArabic ? "امتثال REGA" : "REGA Compliance"}</span>
          </label>
        </div>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.dataProcessingConsent} readOnly />
            <span>{isArabic ? "موافقة معالجة البيانات" : "Data Processing Consent"}</span>
          </label>
        </div>
        <div className={styles.formField}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={formData.electronicSignature} readOnly />
            <span>{isArabic ? "توقيع إلكتروني" : "Electronic Signature"}</span>
          </label>
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label>{isArabic ? "توقيع القبول" : "Signed Acceptance"}</label>
          <div className={styles.fieldValue}>
            {formData.electronicSignature 
              ? `${formData.signatureText || "-"} (${formData.signedBy || "-"} - ${formData.signedAt || "-"})`
              : (isArabic ? "غير مُوقَّع" : "Not Signed")}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertyListingForm = (formData: PropertyListingForm) => (
    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>
        {isArabic ? "إدراج العقار" : "Property Listing"}
      </h3>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>{isArabic ? "رقم صك الملكية" : "Title Deed Number"}</label>
          <div className={styles.fieldValue}>{formData.titleDeedNumber || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "مرجع تسجيل RER" : "RER Registration Reference"}</label>
          <div className={styles.fieldValue}>{formData.rerReference || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "نوع العقار" : "Property Type"}</label>
          <div className={styles.fieldValue}>{formData.propertyType || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "المساحة (م²)" : "Property Size (m²)"}</label>
          <div className={styles.fieldValue}>{formData.propertySize || "-"}</div>
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label>{isArabic ? "الموقع" : "Location"}</label>
          <div className={styles.fieldValue}>{formData.location || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "رقم ترخيص الوساطة" : "Brokerage License Number"}</label>
          <div className={styles.fieldValue}>{formData.brokerageLicenseNumber || "-"}</div>
        </div>
        <div className={styles.formField}>
          <label>{isArabic ? "تحقق من ترخيص REGA/FAL" : "REGA/FAL License Verification"}</label>
          <div className={styles.fieldValue}>{formData.regaFalLicenseVerification || "-"}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${styles.container} ${className}`}>
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.titleBar}>
            <div className={styles.title}>
              <div className={styles.formType}>
                {t[form.formType as FormType]}
              </div>
              <div className={styles.formStatus}>
                {isArabic ? statusLabels[form.status].ar : statusLabels[form.status].en}
              </div>
            </div>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                {isArabic ? "إغلاق" : "Close"}
              </Button>
            )}
          </div>
          <div className={styles.metadata}>
            <span>{isArabic ? "معرّف النموذج:" : "Form ID:"} {form.id}</span>
            <span>{isArabic ? "تم الإنشاء:" : "Created:"} {new Date(form.createdAt).toLocaleString()}</span>
            <span>{isArabic ? "تم التحديث:" : "Updated:"} {new Date(form.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
      
      <div className={styles.content}>
        {form.formType === FormType.KYC && form.parsedFormData && renderKYCForm(form.parsedFormData)}
        {form.formType === FormType.RISK_ACKNOWLEDGMENT && form.parsedFormData && renderRiskAcknowledgmentForm(form.parsedFormData)}
        {form.formType === FormType.SUBSCRIPTION_TERMS && form.parsedFormData && renderSubscriptionTermsForm(form.parsedFormData)}
        {form.formType === FormType.PROPERTY_LISTING && form.parsedFormData && renderPropertyListingForm(form.parsedFormData)}
      </div>
      
      {showHeader && (
        <div className={styles.footer}>
          <div className={styles.watermark}>
            {isArabic ? "منصة SKNAI العقارية" : "SKNAI Real Estate Platform"}
          </div>
        </div>
      )}
    </div>
  );
};