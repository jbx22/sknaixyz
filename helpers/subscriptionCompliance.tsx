export type SubscriptionUserType = "investor" | "owner" | "office" | "developer";
export type SubscriptionPlan = "free" | "basic" | "premium";
export type ComplianceStatus =
  | "pending_documents"
  | "pending_payment"
  | "pending_admin_review"
  | "changes_requested"
  | "approved_active"
  | "rejected"
  | "suspended"
  | "expired"
  | "cancelled";

export interface SignedDocument {
  accepted: boolean;
  signedBy: string;
  signedAt: string;
  signatureText: string;
}

export interface SubscriptionApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userType: SubscriptionUserType;
  requestedPlan: SubscriptionPlan;
  status: ComplianceStatus;
  paymentStatus: "not_required" | "reserved" | "paid_pending_approval";
  createdAt: string;
  updatedAt: string;
  applicant: {
    phone: string;
    nationalId: string;
    organizationName: string;
    crNumber: string;
    regaLicenseNumber: string;
    falLicenseNumber: string;
    licenseExpiry: string;
    responsibleManager: string;
  };
  kyc: {
    fullName: string;
    idNumber: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    sourceOfFunds: string;
    politicallyExposed: "yes" | "no";
  };
  documents: {
    identityFileName: string;
    ownershipFileName: string;
    crFileName: string;
    regaFalFileName: string;
    authorizationFileName: string;
  };
  riskAcknowledgment: SignedDocument;
  termsAcceptance: SignedDocument;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface SubscriptionAuditLog {
  id: string;
  applicationId: string;
  action: string;
  actor: string;
  details: string;
  at: string;
}

export const APPLICATIONS_KEY = "sknai.subscription.applications";
export const AUDIT_KEY = "sknai.subscription.auditLogs";

export function newId(prefix = "sub") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readApplications(): SubscriptionApplication[] {
  try {
    return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeApplications(applications: SubscriptionApplication[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
}

export function readAuditLogs(): SubscriptionAuditLog[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addAuditLog(log: Omit<SubscriptionAuditLog, "id" | "at">) {
  const logs = readAuditLogs();
  logs.unshift({ ...log, id: newId("audit"), at: new Date().toISOString() });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
}

export function saveApplication(application: SubscriptionApplication) {
  const applications = readApplications();
  const existingIndex = applications.findIndex((item) => item.id === application.id);
  if (existingIndex >= 0) applications[existingIndex] = application;
  else applications.unshift(application);
  writeApplications(applications);
}

export function getLatestApplicationForUser(userId?: string, userEmail?: string) {
  const applications = readApplications();
  return applications.find((item) => item.userId === userId || item.userEmail === userEmail) || null;
}

export function hasApprovedRegulatedSubscription(userId?: string, userEmail?: string) {
  const application = getLatestApplicationForUser(userId, userEmail);
  return application?.status === "approved_active";
}

export const userTypeLabels = {
  investor: { en: "Investor / Buyer", ar: "مستثمر / مشتري" },
  owner: { en: "Property Owner", ar: "مالك عقار" },
  office: { en: "Real Estate Office / Broker", ar: "مكتب عقاري / وسيط" },
  developer: { en: "Developer", ar: "مطور عقاري" },
};

export const statusLabels: Record<ComplianceStatus, { en: string; ar: string }> = {
  pending_documents: { en: "Pending documents", ar: "بانتظار المستندات" },
  pending_payment: { en: "Pending payment", ar: "بانتظار الدفع" },
  pending_admin_review: { en: "Pending admin review", ar: "بانتظار مراجعة الإدارة" },
  changes_requested: { en: "Changes requested", ar: "مطلوب تعديلات" },
  approved_active: { en: "Approved active", ar: "معتمد ومفعل" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  suspended: { en: "Suspended", ar: "معلق" },
  expired: { en: "Expired", ar: "منتهي" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
};
