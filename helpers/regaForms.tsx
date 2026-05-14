import { newId } from "./subscriptionCompliance";

export enum FormType {
  KYC = "kyc",
  RISK_ACKNOWLEDGMENT = "risk_acknowledgment",
  SUBSCRIPTION_TERMS = "subscription_terms",
  PROPERTY_LISTING = "property_listing",
}

export interface KYCForm {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  sourceOfFunds: string;
  politicallyExposed: "yes" | "no";
  idDocumentUpload: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAcknowledgmentForm {
  investmentRiskDisclosure: boolean;
  marketRiskWarning: boolean;
  liquidityRiskAcknowledgment: boolean;
  regulatoryRiskAcknowledgment: boolean;
  signedAcceptance: boolean;
  signatureText: string;
  signedBy: string;
  signedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionTermsForm {
  platformTerms: boolean;
  regaCompliance: boolean;
  dataProcessingConsent: boolean;
  electronicSignature: boolean;
  signatureText: string;
  signedBy: string;
  signedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyListingForm {
  titleDeedNumber: string;
  rerReference: string;
  propertyType: string;
  propertySize: number;
  location: string;
  ownershipProof: string;
  brokerageLicenseNumber?: string;
  regaFalLicenseVerification: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegaForm {
  id: string;
  userId: string;
  userEmail: string;
  formType: FormType;
  status: "draft" | "completed" | "submitted" | "approved" | "rejected";
  formData: KYCForm | RiskAcknowledgmentForm | SubscriptionTermsForm | PropertyListingForm;
  createdAt: string;
  updatedAt: string;
}

// Storage keys
const FORMS_KEY = "sknai.rega.forms";

// Helper functions
function readForms(): RegaForm[] {
  try {
    return JSON.parse(localStorage.getItem(FORMS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeForms(forms: RegaForm[]) {
  localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
}

function createFormId(userId: string, formType: FormType): string {
  return `${formType}_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Auto-generate KYC Form
export function generateKYCForm(userId: string, userEmail: string, userData?: Partial<KYCForm>): RegaForm {
  const defaultKYC: KYCForm = {
    fullName: "",
    idNumber: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    sourceOfFunds: "",
    politicallyExposed: "no",
    idDocumentUpload: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const form: RegaForm = {
    id: createFormId(userId, FormType.KYC),
    userId,
    userEmail,
    formType: FormType.KYC,
    status: "draft",
    formData: { ...defaultKYC, ...userData },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const forms = readForms();
  forms.unshift(form);
  writeForms(forms);
  
  return form;
}

// Auto-generate Risk Acknowledgment Form
export function generateRiskAcknowledgmentForm(userId: string, userEmail: string): RegaForm {
  const form: RegaForm = {
    id: createFormId(userId, FormType.RISK_ACKNOWLEDGMENT),
    userId,
    userEmail,
    formType: FormType.RISK_ACKNOWLEDGMENT,
    status: "draft",
    formData: {
      investmentRiskDisclosure: false,
      marketRiskWarning: false,
      liquidityRiskAcknowledgment: false,
      regulatoryRiskAcknowledgment: false,
      signedAcceptance: false,
      signatureText: "",
      signedBy: "",
      signedAt: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as RiskAcknowledgmentForm,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const forms = readForms();
  forms.unshift(form);
  writeForms(forms);
  
  return form;
}

// Auto-generate Subscription Terms Form
export function generateSubscriptionTermsForm(userId: string, userEmail: string): RegaForm {
  const form: RegaForm = {
    id: createFormId(userId, FormType.SUBSCRIPTION_TERMS),
    userId,
    userEmail,
    formType: FormType.SUBSCRIPTION_TERMS,
    status: "draft",
    formData: {
      platformTerms: false,
      regaCompliance: false,
      dataProcessingConsent: false,
      electronicSignature: false,
      signatureText: "",
      signedBy: "",
      signedAt: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as SubscriptionTermsForm,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const forms = readForms();
  forms.unshift(form);
  writeForms(forms);
  
  return form;
}

// Auto-generate Property Listing Form
export function generatePropertyListingForm(userId: string, userEmail: string, propertyData?: Partial<PropertyListingForm>): RegaForm {
  const defaultProperty: PropertyListingForm = {
    titleDeedNumber: "",
    rerReference: "",
    propertyType: "",
    propertySize: 0,
    location: "",
    ownershipProof: "",
    brokerageLicenseNumber: "",
    regaFalLicenseVerification: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const form: RegaForm = {
    id: createFormId(userId, FormType.PROPERTY_LISTING),
    userId,
    userEmail,
    formType: FormType.PROPERTY_LISTING,
    status: "draft",
    formData: { ...defaultProperty, ...propertyData },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const forms = readForms();
  forms.unshift(form);
  writeForms(forms);
  
  return form;
}

// Update form data
export function updateFormData(formId: string, formData: Partial<RegaForm["formData"]>, status?: RegaForm["status"]): RegaForm | null {
  const forms = readForms();
  const formIndex = forms.findIndex(f => f.id === formId);
  
  if (formIndex === -1) return null;
  
  forms[formIndex] = {
    ...forms[formIndex],
    formData: {
      ...forms[formIndex].formData,
      ...formData,
      updatedAt: new Date().toISOString(),
    },
    ...(status && { status, updatedAt: new Date().toISOString() }),
  };
  
  writeForms(forms);
  return forms[formIndex];
}

// Submit completed form
export function submitForm(formId: string, userId: string, userEmail: string): RegaForm | null {
  const form = getFormById(formId);
  if (!form) return null;
  
  return updateFormData(formId, {}, "submitted");
}

// Get forms by user
export function getUserForms(userId: string, formType?: FormType): RegaForm[] {
  const forms = readForms();
  return forms.filter(f => 
    f.userId === userId && 
    (formType ? f.formType === formType : true)
  );
}

// Get forms by status
export function getFormsByStatus(status: RegaForm["status"], formType?: FormType): RegaForm[] {
  const forms = readForms();
  return forms.filter(f => 
    f.status === status && 
    (formType ? f.formType === formType : true)
  );
}

// Get form by ID
export function getFormById(formId: string): RegaForm | null {
  const forms = readForms();
  return forms.find(f => f.id === formId) || null;
}

// Delete form
export function deleteForm(formId: string): boolean {
  const forms = readForms();
  const filtered = forms.filter(f => f.id !== formId);
  if (filtered.length === forms.length) return false;
  
  writeForms(filtered);
  return true;
}

// Auto-generate all forms for regulated workflows
export function autoGenerateRegaForms(userId: string, userEmail: string, userType: string): RegaForm[] {
  const forms: RegaForm[] = [];
  
  // Always generate KYC form
  forms.push(generateKYCForm(userId, userEmail));
  
  // Always generate risk acknowledgment
  forms.push(generateRiskAcknowledgmentForm(userId, userEmail));
  
  // Always generate subscription terms
  forms.push(generateSubscriptionTermsForm(userId, userEmail));
  
  // Generate property listing form if user is owner/broker
  if (userType === "owner" || userType === "office") {
    forms.push(generatePropertyListingForm(userId, userEmail));
  }
  
  return forms;
}

// Check if required forms are completed
export function checkRequiredFormsCompleted(userId: string, userType: string): boolean {
  const userForms = getUserForms(userId);
  const requiredFormTypes = [FormType.KYC, FormType.RISK_ACKNOWLEDGMENT, FormType.SUBSCRIPTION_TERMS];
  
  // Check if all required form types exist
  for (const formType of requiredFormTypes) {
    const form = userForms.find(f => f.formType === formType);
    if (!form || form.status !== "completed") {
      return false;
    }
  }
  
  // For owners/brokers, also check property listing form
  if (userType === "owner" || userType === "office") {
    const propertyForm = userForms.find(f => f.formType === FormType.PROPERTY_LISTING);
    if (!propertyForm || propertyForm.status !== "completed") {
      return false;
    }
  }
  
  return true;
}

// Get form status summary
export function getFormStatusSummary(userId: string): Record<FormType, { status: RegaForm["status"]; updatedAt: string }> {
  const userForms = getUserForms(userId);
  const summary: Record<FormType, { status: RegaForm["status"]; updatedAt: string }> = {
    [FormType.KYC]: { status: "draft", updatedAt: "" },
    [FormType.RISK_ACKNOWLEDGMENT]: { status: "draft", updatedAt: "" },
    [FormType.SUBSCRIPTION_TERMS]: { status: "draft", updatedAt: "" },
    [FormType.PROPERTY_LISTING]: { status: "draft", updatedAt: "" },
  };
  
  for (const form of userForms) {
    summary[form.formType] = {
      status: form.status,
      updatedAt: form.updatedAt,
    };
  }
  
  return summary;
}

// Arabic translations for form types
export const formTypeLabels = {
  [FormType.KYC]: { en: "KYC Form", ar: "نموذج معلومات العميل" },
  [FormType.RISK_ACKNOWLEDGMENT]: { en: "Risk Acknowledgment", ar: "إقرار المخاطر" },
  [FormType.SUBSCRIPTION_TERMS]: { en: "Subscription Terms", ar: "شروط الاشتراك" },
  [FormType.PROPERTY_LISTING]: { en: "Property Listing", ar: "إدراج العقار" },
};

// Status translations
export const statusLabels = {
  draft: { en: "Draft", ar: "مسودة" },
  completed: { en: "Completed", ar: "مكتمل" },
  submitted: { en: "Submitted", ar: "مقدم" },
  approved: { en: "Approved", ar: "معتمد" },
  rejected: { en: "Rejected", ar: "مرفوض" },
};