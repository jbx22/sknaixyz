export type WorkflowStatus = "draft" | "pending_admin_review" | "changes_requested" | "approved" | "rejected" | "suspended" | "listed" | "settled";
export type AssetUserType = "owner" | "broker" | "developer" | "investor";

export interface RegaChecklist {
  falLicenseNumber: string;
  regaAdLicenseNumber: string;
  brokerageContractNumber: string;
  ownershipDocumentNumber: string;
  marketingScopeConfirmed: boolean;
  adChannelsConfirmed: boolean;
  responsibleOfficer: string;
  disclosuresAccepted: boolean;
}

export interface FractionalOwnershipRequest {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantType: AssetUserType;
  propertyTitle: string;
  city: string;
  estimatedValue: string;
  fractionalPercent: string;
  targetRaise: string;
  minimumTicket: string;
  incomeModel: string;
  useOfFunds: string;
  exitPlan: string;
  riskSummary: string;
  documents: string[];
  rega: RegaChecklist;
  status: WorkflowStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenizationRequest {
  id: string;
  applicantName: string;
  applicantEmail: string;
  propertyTitle: string;
  assetValue: string;
  tokenSymbol: string;
  totalTokens: string;
  tokenPrice: string;
  investorCap: string;
  lockupPeriod: string;
  distributionFrequency: string;
  custodyModel: string;
  smartContractReview: boolean;
  riskSummary: string;
  documents: string[];
  rega: RegaChecklist;
  status: WorkflowStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecondaryMarketOrder {
  id: string;
  investorName: string;
  investorEmail: string;
  assetTitle: string;
  tokenSymbol: string;
  side: "buy" | "sell";
  quantity: string;
  limitPrice: string;
  suitabilityConfirmed: boolean;
  holdingConfirmed: boolean;
  disclosureAccepted: boolean;
  coolingOffAccepted: boolean;
  bestExecutionNote: string;
  status: WorkflowStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAuditLog {
  id: string;
  workflow: "fractional" | "tokenization" | "secondary";
  targetId: string;
  actor: string;
  action: string;
  details: string;
  at: string;
}

const FRACTIONAL_KEY = "sknai.fractionalOwnership.requests";
const TOKENIZATION_KEY = "sknai.tokenization.requests.v2";
const SECONDARY_KEY = "sknai.secondaryMarket.orders";
const AUDIT_KEY = "sknai.assetWorkflow.audit";
const FORMS_KEY = "sknai.rega.forms";

export function workflowId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}
function writeJson<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }

export function readFractionalRequests() { return readJson<FractionalOwnershipRequest[]>(FRACTIONAL_KEY, []); }
export function saveFractionalRequest(item: FractionalOwnershipRequest) {
  const items = readFractionalRequests();
  const idx = items.findIndex((x) => x.id === item.id);
  if (idx >= 0) items[idx] = item; else items.unshift(item);
  writeJson(FRACTIONAL_KEY, items);
}
export function readTokenizationRequests() { return readJson<TokenizationRequest[]>(TOKENIZATION_KEY, []); }
export function saveTokenizationRequest(item: TokenizationRequest) {
  const items = readTokenizationRequests();
  const idx = items.findIndex((x) => x.id === item.id);
  if (idx >= 0) items[idx] = item; else items.unshift(item);
  writeJson(TOKENIZATION_KEY, items);
}
export function readSecondaryOrders() { return readJson<SecondaryMarketOrder[]>(SECONDARY_KEY, []); }
export function saveSecondaryOrder(item: SecondaryMarketOrder) {
  const items = readSecondaryOrders();
  const idx = items.findIndex((x) => x.id === item.id);
  if (idx >= 0) items[idx] = item; else items.unshift(item);
  writeJson(SECONDARY_KEY, items);
}
export function readWorkflowAudit() { return readJson<WorkflowAuditLog[]>(AUDIT_KEY, []); }
export function addWorkflowAudit(log: Omit<WorkflowAuditLog, "id" | "at">) {
  const logs = readWorkflowAudit();
  logs.unshift({ ...log, id: workflowId("audit"), at: new Date().toISOString() });
  writeJson(AUDIT_KEY, logs.slice(0, 500));
}

export const regaRules = [
  "Verify FAL/REGA license scope before regulated brokerage, marketing, or advertisement activity.",
  "Require valid brokerage/marketing contract and ownership document before issuing or publishing an advertisement.",,
  "Require real-estate advertisement license number, advertising channels, responsible officer, price, and accuracy declaration before public promotion.",
  "Admin approval must record KYC, property ownership, disclosures, risk acknowledgement, and document review.",
  "Secondary-market orders require investor suitability, holdings check for sell orders, disclosure acceptance, order review, audit trail, and fair/best-execution note.",
];

export function emptyRegaChecklist(): RegaChecklist {
  return { falLicenseNumber: "", regaAdLicenseNumber: "", brokerageContractNumber: "", ownershipDocumentNumber: "", marketingScopeConfirmed: false, adChannelsConfirmed: false, responsibleOfficer: "", disclosuresAccepted: false };
}

// Import REGA forms helpers
import { autoGenerateRegaForms, FormType, getUserForms, checkRequiredFormsCompleted } from "./regaForms";

// Helper to get user type from email (mock implementation for development)
function getUserTypeFromEmail(email: string): AssetUserType {
  if (email.includes("owner")) return "owner";
  if (email.includes("broker")) return "broker";
  if (email.includes("developer")) return "developer";
  return "investor";
}

// Auto-generate REGA forms when workflow items are created
export function createWorkflowWithRegaForms(
  workflowType: "fractional" | "tokenization" | "secondary",
  request: FractionalOwnershipRequest | TokenizationRequest | SecondaryMarketOrder,
  userEmail: string
): void {
  const userId = request.id; // Use workflow ID as user ID for development
  const userType = getUserTypeFromEmail(userEmail);
  
  // Auto-generate REGA forms
  const forms = autoGenerateRegaForms(userId, userEmail, userType);
  
  // Log the form generation
  addWorkflowAudit({
    workflow: workflowType as any,
    targetId: request.id,
    actor: "system",
    action: "rega_forms_generated",
    details: `Auto-generated ${forms.length} REGA forms for user ${userEmail} (${userType})`
  });
}

// Validate REGA forms before workflow approval
export function validateRegaFormsForWorkflow(
  workflowType: "fractional" | "tokenization" | "secondary",
  userId: string,
  userType: AssetUserType
): boolean {
  // Check if all required forms are completed
  const formsComplete = checkRequiredFormsCompleted(userId, userType);
  
  if (!formsComplete) {
    addWorkflowAudit({
      workflow: workflowType as any,
      targetId: userId,
      actor: "system",
      action: "rega_forms_incomplete",
      details: `Required REGA forms not completed for ${userType} in ${workflowType} workflow`
    });
    return false;
  }
  
  return true;
}

// Pre-process workflow data with REGA form generation
export function preprocessWorkflowRequest(
  workflowType: "fractional" | "tokenization" | "secondary",
  request: FractionalOwnershipRequest | TokenizationRequest | SecondaryMarketOrder,
  userEmail: string
): {
  processedRequest: FractionalOwnershipRequest | TokenizationRequest | SecondaryMarketOrder;
  formsGenerated: boolean;
} {
  const userId = request.id;
  const userType = getUserTypeFromEmail(userEmail);
  
  // Auto-generate REGA forms if they don't exist
  const forms = autoGenerateRegaForms(userId, userEmail, userType);
  const formsGenerated = forms.length > 0;
  
  // Add REGA validation data to the request
  const processedRequest = {
    ...request,
    regaValidation: {
      formsCompleted: checkRequiredFormsCompleted(userId, userType),
      formsGenerated,
      formTypes: forms.map(f => f.formType),
      lastUpdated: new Date().toISOString()
    }
  } as any;
  
  // Log the preprocessing
  addWorkflowAudit({
    workflow: workflowType as any,
    targetId: request.id,
    actor: "system",
    action: "workflow_preprocessed",
    details: `Processed ${workflowType} request with REGA forms validation (${formsGenerated ? 'forms generated' : 'forms already exist'})`
  });
  
  return { processedRequest, formsGenerated };
}

// Update REGA forms status during workflow transitions
export function updateRegaFormsStatus(
  workflowType: "fractional" | "tokenization" | "secondary",
  targetId: string,
  newStatus: "approved" | "rejected" | "changes_requested",
  notes?: string
): void {
  const userId = targetId;
  const userForms = getUserForms(userId);
  
  // Update all user forms with the workflow decision
  const updatedForms = userForms.map(form => ({
    ...form,
    status: form.status === "completed" ? newStatus : form.status,
    updatedAt: new Date().toISOString()
  }));
  
  // Write updated forms back to storage
  writeJson(FORMS_KEY, updatedForms);
  
  // Log the status update
  addWorkflowAudit({
    workflow: workflowType as any,
    targetId,
    actor: "system",
    action: "rega_forms_status_updated",
    details: `Updated REGA forms status to ${newStatus} for ${workflowType} workflow${notes ? ': ' + notes : ''}`
  });
}
