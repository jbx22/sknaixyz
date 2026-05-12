import { addAuditLog, getLatestApplicationForUser, saveApplication, SubscriptionUserType, newId } from "./subscriptionCompliance";
import { User } from "./User";

export const DEMO_PASSWORD = "demo123";

export const DEMO_ACCOUNTS = [
  { email: "demo.investor@sknai.test", password: DEMO_PASSWORD, label: "Investor / Buyer", arLabel: "مستثمر / مشتري", role: "user", userType: "investor", approved: true },
  { email: "demo.owner@sknai.test", password: DEMO_PASSWORD, label: "Property Owner", arLabel: "مالك عقار", role: "user", userType: "owner", approved: true },
  { email: "demo.broker@sknai.test", password: DEMO_PASSWORD, label: "Real Estate Office / Broker", arLabel: "مكتب عقاري / وسيط", role: "user", userType: "office", approved: true },
  { email: "demo.developer@sknai.test", password: DEMO_PASSWORD, label: "Developer", arLabel: "مطور عقاري", role: "user", userType: "developer", approved: true },
  { email: "demo.admin@sknai.test", password: DEMO_PASSWORD, label: "Admin", arLabel: "مدير", role: "admin", userType: "office", approved: true },
  { email: "demo.superadmin@sknai.test", password: DEMO_PASSWORD, label: "Super Admin", arLabel: "المسؤول الأعلى", role: "superadmin", userType: "office", approved: true },
] as const;

export function seedDemoComplianceForUser(user: User) {
  const demo = DEMO_ACCOUNTS.find((account) => account.email === user.email.toLowerCase());
  if (!demo || !demo.approved) return;
  if (getLatestApplicationForUser(String(user.id), user.email)?.status === "approved_active") return;

  const now = new Date().toISOString();
  const application = {
    id: newId("demo_sub"),
    userId: String(user.id),
    userEmail: user.email,
    userName: user.displayName,
    userType: demo.userType as SubscriptionUserType,
    requestedPlan: "premium" as const,
    status: "approved_active" as const,
    paymentStatus: "paid_pending_approval" as const,
    createdAt: now,
    updatedAt: now,
    applicant: {
      phone: "+966500000000",
      nationalId: "1000000000",
      organizationName: demo.label,
      crNumber: demo.userType === "investor" ? "" : "1010000000",
      regaLicenseNumber: demo.userType === "investor" ? "" : "REGA-DEMO-001",
      falLicenseNumber: demo.userType === "investor" ? "" : "FAL-DEMO-001",
      licenseExpiry: "2027-12-31",
      responsibleManager: user.displayName,
    },
    kyc: {
      fullName: user.displayName,
      idNumber: "1000000000",
      dateOfBirth: "1990-01-01",
      nationality: "Saudi Arabia",
      address: "Riyadh, Saudi Arabia",
      sourceOfFunds: "Demo account",
      politicallyExposed: "no" as const,
    },
    documents: {
      identityFileName: "demo-identity.pdf",
      ownershipFileName: demo.userType === "owner" ? "demo-title-deed.pdf" : "",
      crFileName: ["office", "developer"].includes(demo.userType) ? "demo-cr.pdf" : "",
      regaFalFileName: ["office", "developer"].includes(demo.userType) ? "demo-rega-fal.pdf" : "",
      authorizationFileName: demo.userType === "developer" ? "demo-project-authorization.pdf" : "",
    },
    riskAcknowledgment: { accepted: true, signedBy: user.displayName, signedAt: now, signatureText: `${user.displayName} - ${now}` },
    termsAcceptance: { accepted: true, signedBy: user.displayName, signedAt: now, signatureText: `${user.displayName} - ${now}` },
    adminNotes: "Demo account pre-approved for testing regulated workflows.",
    approvedBy: "demo.superadmin@sknai.test",
    approvedAt: now,
  };

  saveApplication(application);
  addAuditLog({ applicationId: application.id, action: "DEMO_APPROVED", actor: "system", details: "Seeded approved demo subscription for workflow testing" });
}
