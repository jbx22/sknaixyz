import { DEMO_ACCOUNTS } from "./demoAccounts";

export type ManagedAdminStatus = "active" | "revoked" | "suspended";
export type ManagedAdminRole = "admin" | "superadmin";

export interface ManagedAdmin {
  id: string;
  displayName: string;
  email: string;
  role: ManagedAdminRole;
  status: ManagedAdminStatus;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
  demo?: boolean;
}

export interface AdminUsageLog {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  target: string;
  outcome: "success" | "warning" | "blocked";
  qualityNote: string;
  createdAt: string;
}

const ADMINS_KEY = "sknai.superadmin.managedAdmins";
const ADMIN_USAGE_KEY = "sknai.superadmin.adminUsageLogs";

export const defaultAdminPermissions = [
  "users:review",
  "subscriptions:approve",
  "properties:review",
  "tokenization:review",
  "kyc:review",
  "audit:read",
];

export function governanceId(prefix = "adm") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function demoManagedAdmins(): ManagedAdmin[] {
  const now = new Date().toISOString();
  return DEMO_ACCOUNTS
    .filter((account) => account.role === "admin" || account.role === "superadmin")
    .map((account, index) => ({
      id: `demo_admin_${index}`,
      displayName: account.label,
      email: account.email,
      role: account.role as ManagedAdminRole,
      status: "active" as ManagedAdminStatus,
      permissions: account.role === "superadmin" ? ["*"] : defaultAdminPermissions,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      notes: "Built-in demo account",
      demo: true,
    }));
}

export function readManagedAdmins(): ManagedAdmin[] {
  const custom = readJson<ManagedAdmin[]>(ADMINS_KEY, []);
  const customEmails = new Set(custom.map((admin) => admin.email.toLowerCase()));
  return [...demoManagedAdmins().filter((admin) => !customEmails.has(admin.email.toLowerCase())), ...custom];
}

export function writeManagedAdmins(admins: ManagedAdmin[]) {
  writeJson(ADMINS_KEY, admins.filter((admin) => !admin.demo));
}

export function upsertManagedAdmin(admin: ManagedAdmin) {
  const custom = readJson<ManagedAdmin[]>(ADMINS_KEY, []);
  const idx = custom.findIndex((item) => item.id === admin.id || item.email.toLowerCase() === admin.email.toLowerCase());
  const clean = { ...admin, demo: false, updatedAt: new Date().toISOString() };
  if (idx >= 0) custom[idx] = clean;
  else custom.unshift(clean);
  writeJson(ADMINS_KEY, custom);
}

export function removeManagedAdmin(id: string) {
  const custom = readJson<ManagedAdmin[]>(ADMINS_KEY, []);
  writeJson(ADMINS_KEY, custom.filter((admin) => admin.id !== id));
}

export function addAdminUsageLog(log: Omit<AdminUsageLog, "id" | "createdAt">) {
  const logs = readAdminUsageLogs();
  logs.unshift({ ...log, id: governanceId("usage"), createdAt: new Date().toISOString() });
  writeJson(ADMIN_USAGE_KEY, logs.slice(0, 300));
}

export function seedAdminUsageLogs() {
  const logs = readJson<AdminUsageLog[]>(ADMIN_USAGE_KEY, []);
  if (logs.length) return logs;
  const now = Date.now();
  const seeded: AdminUsageLog[] = [
    { id: governanceId("usage"), adminEmail: "demo.admin@sknai.test", adminName: "Demo Admin", action: "Approved subscription", target: "demo.owner@sknai.test", outcome: "success", qualityNote: "KYC, REGA/FAL evidence, and e-signatures reviewed before activation.", createdAt: new Date(now - 1000 * 60 * 18).toISOString() },
    { id: governanceId("usage"), adminEmail: "demo.admin@sknai.test", adminName: "Demo Admin", action: "Requested changes", target: "Tokenization request", outcome: "warning", qualityNote: "Asked for clearer ownership evidence before allowing tokenization.", createdAt: new Date(now - 1000 * 60 * 47).toISOString() },
    { id: governanceId("usage"), adminEmail: "demo.superadmin@sknai.test", adminName: "Demo Super Admin", action: "Reviewed admin activity", target: "Quality control", outcome: "success", qualityNote: "No critical compliance exceptions detected in demo logs.", createdAt: new Date(now - 1000 * 60 * 82).toISOString() },
  ];
  writeJson(ADMIN_USAGE_KEY, seeded);
  return seeded;
}

export function readAdminUsageLogs(): AdminUsageLog[] {
  const logs = readJson<AdminUsageLog[]>(ADMIN_USAGE_KEY, []);
  return logs.length ? logs : seedAdminUsageLogs();
}
