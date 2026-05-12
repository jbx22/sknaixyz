import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Edit3, Eye, Shield, ShieldAlert, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { readApplications } from "../helpers/subscriptionCompliance";
import { addAdminUsageLog, defaultAdminPermissions, governanceId, ManagedAdmin, readAdminUsageLogs, readManagedAdmins, removeManagedAdmin, upsertManagedAdmin } from "../helpers/adminGovernance";
import styles from "../pages/superadmin.module.css";

type Mode = "overview" | "admins" | "logs" | "monitoring";

function readLocalCount(key: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function SuperAdminGovernance({ mode = "overview" }: { mode?: Mode }) {
  const { language } = useLanguage();
  const { authState } = useAuth();
  const ar = language === "ar";
  const actor = authState.type === "authenticated" ? authState.user.email : "superadmin";
  const [admins, setAdmins] = useState<ManagedAdmin[]>(() => readManagedAdmins());
  const [logs, setLogs] = useState(() => readAdminUsageLogs());
  const [editing, setEditing] = useState<ManagedAdmin | null>(null);
  const [form, setForm] = useState({ displayName: "", email: "", role: "admin", status: "active", notes: "" });

  const applications = useMemo(() => readApplications(), [admins, logs]);
  const stats = useMemo(() => ({
    activeAdmins: admins.filter((admin) => admin.status === "active" && admin.role === "admin").length,
    superAdmins: admins.filter((admin) => admin.status === "active" && admin.role === "superadmin").length,
    revokedAdmins: admins.filter((admin) => admin.status !== "active").length,
    adminActions: logs.length,
    pendingSubscriptions: applications.filter((app) => app.status === "pending_admin_review" || app.status === "changes_requested").length,
    approvedSubscriptions: applications.filter((app) => app.status === "approved_active").length,
    tokenizationRequests: readLocalCount("sknai.tokenization.requests"),
    fractionalRequests: readLocalCount("sknai.fractionalOwnership.applications"),
  }), [admins, logs, applications]);

  const resetForm = () => {
    setEditing(null);
    setForm({ displayName: "", email: "", role: "admin", status: "active", notes: "" });
  };

  const refresh = () => {
    setAdmins(readManagedAdmins());
    setLogs(readAdminUsageLogs());
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.displayName.trim() || !form.email.trim()) {
      toast.error(ar ? "الاسم والبريد مطلوبان" : "Name and email are required");
      return;
    }
    const now = new Date().toISOString();
    const admin: ManagedAdmin = {
      id: editing?.id || governanceId("admin"),
      displayName: form.displayName.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role as ManagedAdmin["role"],
      status: form.status as ManagedAdmin["status"],
      permissions: form.role === "superadmin" ? ["*"] : defaultAdminPermissions,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
      createdBy: editing?.createdBy || actor,
      notes: form.notes,
    };
    upsertManagedAdmin(admin);
    addAdminUsageLog({ adminEmail: actor, adminName: actor, action: editing ? "Edited admin" : "Assigned new admin", target: admin.email, outcome: "success", qualityNote: admin.notes || "Super admin lifecycle control update." });
    toast.success(editing ? (ar ? "تم تعديل المسؤول" : "Admin updated") : (ar ? "تم تعيين مسؤول جديد" : "New admin assigned"));
    resetForm();
    refresh();
  };

  const act = (admin: ManagedAdmin, status: ManagedAdmin["status"] | "delete") => {
    if (admin.demo && status === "delete") {
      toast.error(ar ? "لا يمكن حذف حساب تجريبي مدمج" : "Built-in demo accounts cannot be deleted");
      return;
    }
    if (status === "delete") {
      removeManagedAdmin(admin.id);
      addAdminUsageLog({ adminEmail: actor, adminName: actor, action: "Deleted admin", target: admin.email, outcome: "warning", qualityNote: "Admin removed by super admin." });
    } else {
      upsertManagedAdmin({ ...admin, demo: false, status, updatedAt: new Date().toISOString() });
      addAdminUsageLog({ adminEmail: actor, adminName: actor, action: status === "revoked" ? "Revoked admin" : status === "suspended" ? "Suspended admin" : "Activated admin", target: admin.email, outcome: status === "active" ? "success" : "warning", qualityNote: "Admin access lifecycle action recorded for QC." });
    }
    refresh();
  };

  const startEdit = (admin: ManagedAdmin) => {
    setEditing(admin);
    setForm({ displayName: admin.displayName, email: admin.email, role: admin.role, status: admin.status, notes: admin.notes || "" });
  };

  const StatCards = () => (
    <div className={styles.roleStatsGrid}>
      {[
        [Shield, ar ? "المسؤولون النشطون" : "Active admins", stats.activeAdmins],
        [ShieldAlert, ar ? "المسؤول الأعلى" : "Super admins", stats.superAdmins],
        [UserMinus, ar ? "موقوف/مسحوب" : "Revoked/suspended", stats.revokedAdmins],
        [ClipboardList, ar ? "سجلات استخدام الإدارة" : "Admin usage logs", stats.adminActions],
        [CheckCircle2, ar ? "اشتراكات بانتظار المراجعة" : "Pending subscriptions", stats.pendingSubscriptions],
        [Eye, ar ? "طلبات ترميز/ملكية" : "Tokenization/fractional", stats.tokenizationRequests + stats.fractionalRequests],
      ].map(([Icon, label, value]) => (
        <div className={styles.roleStatCard} key={String(label)}>
          <div className={styles.roleStatIcon}><Icon size={24} /></div>
          <div className={styles.roleStatContent}><div className={styles.roleStatValue}>{value as number}</div><div className={styles.roleStatLabel}>{label as string}</div></div>
        </div>
      ))}
    </div>
  );

  const AdminTable = () => (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{ar ? "إدارة دورة حياة المسؤولين" : "Admin lifecycle management"}</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead><tr><th>{ar ? "المسؤول" : "Admin"}</th><th>{ar ? "الدور" : "Role"}</th><th>{ar ? "الحالة" : "Status"}</th><th>{ar ? "الصلاحيات" : "Permissions"}</th><th>{ar ? "الإجراءات" : "Actions"}</th></tr></thead>
          <tbody>{admins.map((admin) => (
            <tr key={admin.id}>
              <td><div className={styles.userInfo}><span className={styles.userName}>{admin.displayName} {admin.demo && <Badge variant="outline">Demo</Badge>}</span><span className={styles.userEmail}>{admin.email}</span></div></td>
              <td><Badge variant={admin.role === "superadmin" ? "warning" : "default"}>{admin.role}</Badge></td>
              <td><Badge variant={admin.status === "active" ? "success" : admin.status === "suspended" ? "warning" : "destructive"}>{admin.status}</Badge></td>
              <td><span className={styles.userEmail}>{admin.permissions.includes("*") ? "All permissions" : admin.permissions.slice(0, 3).join(", ")}</span></td>
              <td><div className={styles.actions}>
                <Button size="icon-sm" variant="ghost" onClick={() => startEdit(admin)} title={ar ? "تعديل" : "Edit"}><Edit3 size={15} /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => act(admin, "active")} title={ar ? "تفعيل" : "Activate"}><CheckCircle2 size={15} className={styles.successIcon} /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => act(admin, "revoked")} title={ar ? "سحب الصلاحية" : "Revoke"}><UserMinus size={15} className={styles.warningIcon} /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => act(admin, "delete")} title={ar ? "حذف" : "Delete"}><Trash2 size={15} className={styles.dangerIcon} /></Button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const AdminForm = () => (
    <div className={styles.createCard}>
      <h3 className={styles.cardTitle}>{editing ? (ar ? "تعديل مسؤول" : "Edit admin") : (ar ? "تعيين مسؤول جديد" : "Assign new admin")}</h3>
      <form onSubmit={submit} className={styles.form}>
        <label>{ar ? "الاسم" : "Name"}<Input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} /></label>
        <label>{ar ? "البريد" : "Email"}<Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></label>
        <div className={styles.formRow}>
          <label className={styles.flex1}>{ar ? "الدور" : "Role"}<select className={styles.selectFix} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select></label>
          <label className={styles.flex1}>{ar ? "الحالة" : "Status"}<select className={styles.selectFix} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="active">Active</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></select></label>
        </div>
        <label>{ar ? "ملاحظات الجودة" : "Quality notes"}<Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></label>
        <Button type="submit"><UserPlus size={16} /> {editing ? (ar ? "حفظ التعديل" : "Save changes") : (ar ? "تعيين المسؤول" : "Assign admin")}</Button>
        {editing && <Button type="button" variant="secondary" onClick={resetForm}>{ar ? "إلغاء التعديل" : "Cancel edit"}</Button>}
      </form>
    </div>
  );

  const UsageLogs = () => (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{ar ? "سجل استخدام المسؤولين لمراقبة الجودة" : "Admin usage logs for quality control"}</h3>
      <div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>{ar ? "المسؤول" : "Admin"}</th><th>{ar ? "الإجراء" : "Action"}</th><th>{ar ? "الهدف" : "Target"}</th><th>{ar ? "ملاحظة الجودة" : "Quality note"}</th><th>{ar ? "الوقت" : "Time"}</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{log.adminName}<br/><span className={styles.userEmail}>{log.adminEmail}</span></td><td><Badge variant={log.outcome === "success" ? "success" : log.outcome === "warning" ? "warning" : "destructive"}>{log.action}</Badge></td><td>{log.target}</td><td>{log.qualityNote}</td><td>{new Date(log.createdAt).toLocaleString(ar ? "ar-SA" : "en-US")}</td></tr>)}</tbody></table></div>
    </div>
  );

  const Monitoring = () => (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{ar ? "قائمة مراقبة الإدارة" : "Admin monitoring checklist"}</h3>
      <div className={styles.roleStatsGrid}>
        {[
          ["/admin/subscription-approvals", ar ? "طلبات اشتراك تحتاج قرار" : "Subscription approvals needing decision", stats.pendingSubscriptions],
          ["/admin/tokenization", ar ? "طلبات الترميز" : "Tokenization requests", stats.tokenizationRequests],
          ["/admin/tokenization-kyc", ar ? "مراجعة KYC" : "KYC reviews", applications.filter((a) => a.kyc.politicallyExposed === "yes").length],
          ["/admin/properties", ar ? "نشر العقارات والامتثال الإعلاني" : "Property publishing/ad compliance", readLocalCount("sknai.fractionalOwnership.applications")],
          ["/admin/compliance", ar ? "سجلات الامتثال والتدقيق" : "Compliance and audit logs", stats.adminActions],
          ["/admin/users", ar ? "حسابات موقوفة/مسحوبة" : "Suspended/revoked access", stats.revokedAdmins],
        ].map(([path, label, value]) => (
          <a className={styles.roleStatCard} href={path as string} key={path as string}>
            <div className={styles.roleStatIcon}><Eye size={22} /></div><div className={styles.roleStatContent}><div className={styles.roleStatValue}>{value as number}</div><div className={styles.roleStatLabel}>{label as string}</div></div>
          </a>
        ))}
      </div>
    </div>
  );

  if (mode === "overview") return <><StatCards /><div style={{ height: "var(--spacing-6)" }} /><Monitoring /></>;
  if (mode === "logs") return <UsageLogs />;
  if (mode === "monitoring") return <Monitoring />;
  return <div className={styles.grid}><AdminForm /><AdminTable /><div style={{ gridColumn: "1 / -1" }}><UsageLogs /></div><div style={{ gridColumn: "1 / -1" }}><Monitoring /></div></div>;
}
