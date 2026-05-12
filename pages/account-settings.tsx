import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  Download, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  FileText,
  Undo2
} from "lucide-react";

import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger 
} from "../components/Dialog";

import { getUserExportData } from "../endpoints/user/export_data_GET.schema";
import { requestAccountDeletion } from "../endpoints/user/request_deletion_POST.schema";
import { cancelAccountDeletion } from "../endpoints/user/cancel_deletion_POST.schema";

import styles from "./account-settings.module.css";

export default function AccountSettingsPage() {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isDeletionDialogOpen, setIsDeletionDialogOpen] = useState(false);
  const [isPendingDeletion, setIsPendingDeletion] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authState.type === "unauthenticated") {
      navigate("/login");
    }
  }, [authState, navigate]);

  const exportMutation = useMutation({
    mutationFn: getUserExportData,
    onSuccess: (data) => {
      // Create a blob and trigger download
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sknai-user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(language === "ar" ? "تم تصدير البيانات بنجاح" : "Data exported successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: requestAccountDeletion,
    onSuccess: () => {
      setIsDeletionDialogOpen(false);
      setIsPendingDeletion(true);
      toast.success(language === "ar" ? "تم تقديم طلب حذف الحساب" : "Account deletion request submitted");
    },
    onError: (error) => {
      // If error says already pending, update state
      if (error instanceof Error && error.message.includes("already have a pending")) {
        setIsPendingDeletion(true);
        setIsDeletionDialogOpen(false);
        toast.info(language === "ar" ? "لديك طلب حذف معلق بالفعل" : "You already have a pending deletion request");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to request deletion");
      }
    }
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: cancelAccountDeletion,
    onSuccess: () => {
      setIsPendingDeletion(false);
      toast.success(language === "ar" ? "تم إلغاء طلب الحذف" : "Deletion request cancelled");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to cancel deletion");
    }
  });

  if (authState.type === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton className={styles.titleSkeleton} />
        </div>
        <div className={styles.card}>
          <Skeleton className={styles.rowSkeleton} />
          <Skeleton className={styles.rowSkeleton} />
          <Skeleton className={styles.rowSkeleton} />
        </div>
      </div>
    );
  }

  if (authState.type !== "authenticated") return null;

  const { user } = authState;

  const t = {
    title: language === "ar" ? "إعدادات الحساب" : "Account Settings",
    personalInfo: language === "ar" ? "المعلومات الشخصية" : "Personal Information",
    displayName: language === "ar" ? "الاسم المعروض" : "Display Name",
    email: language === "ar" ? "البريد الإلكتروني" : "Email",
    role: language === "ar" ? "نوع الحساب" : "Account Type",
    dataPrivacy: language === "ar" ? "البيانات والخصوصية" : "Data & Privacy",
    exportData: language === "ar" ? "تصدير بياناتي" : "Export My Data",
    exportDesc: language === "ar" ? "قم بتنزيل نسخة من جميع بياناتك الشخصية بتنسيق JSON." : "Download a copy of all your personal data in JSON format.",
    deleteAccount: language === "ar" ? "حذف الحساب" : "Delete Account",
    deleteDesc: language === "ar" ? "اطلب حذف حسابك وجميع البيانات المرتبطة به نهائيًا." : "Request to permanently delete your account and all associated data.",
    cancelDeletion: language === "ar" ? "إلغاء طلب الحذف" : "Cancel Deletion Request",
    cancelDesc: language === "ar" ? "لديك طلب حذف معلق. يمكنك إلغاؤه لاستعادة الوصول الكامل." : "You have a pending deletion request. Cancel it to restore full access.",
    confirmDeleteTitle: language === "ar" ? "هل أنت متأكد؟" : "Are you sure?",
    confirmDeleteDesc: language === "ar" 
      ? "هذا الإجراء لا يمكن التراجع عنه. سيتم جدولة حسابك للحذف وسيتم إزالة بياناتك نهائيًا من خوادمنا." 
      : "This action cannot be undone. Your account will be scheduled for deletion and your data will be permanently removed from our servers.",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    confirm: language === "ar" ? "تأكيد الحذف" : "Confirm Deletion",
    exporting: language === "ar" ? "جاري التصدير..." : "Exporting...",
    processing: language === "ar" ? "جاري المعالجة..." : "Processing...",
    pendingBadge: language === "ar" ? "معلق" : "Pending",
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t.title} | SKNAI</title>
      </Helmet>

      <h1 className={styles.title}>{t.title}</h1>

      {/* Personal Information Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <User className={styles.icon} size={20} />
          {t.personalInfo}
        </h2>
        <div className={styles.card}>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>{t.displayName}</div>
            <div className={styles.infoValue}>{user.displayName}</div>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>{t.email}</div>
            <div className={styles.infoValue}>
              <Mail size={16} className={styles.smallIcon} />
              {user.email}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>{t.role}</div>
            <div className={styles.infoValue}>
              <Shield size={16} className={styles.smallIcon} />
              <span className={styles.roleBadge}>{user.role}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Data & Privacy Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FileText className={styles.icon} size={20} />
          {t.dataPrivacy}
        </h2>
        <div className={styles.card}>
          {/* Export Data */}
          <div className={styles.actionRow}>
            <div className={styles.actionInfo}>
              <h3 className={styles.actionTitle}>{t.exportData}</h3>
              <p className={styles.actionDesc}>{t.exportDesc}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => exportMutation.mutate(undefined)}
              disabled={exportMutation.isPending}
            >
              <Download size={18} />
              {exportMutation.isPending ? t.exporting : t.exportData}
            </Button>
          </div>

          <div className={styles.divider} />

          {/* Delete / Cancel Delete Account */}
          <div className={styles.actionRow}>
            <div className={styles.actionInfo}>
              <h3 className={`${styles.actionTitle} ${styles.dangerText}`}>
                {isPendingDeletion ? t.cancelDeletion : t.deleteAccount}
                {isPendingDeletion && <span className={styles.pendingBadge}>{t.pendingBadge}</span>}
              </h3>
              <p className={styles.actionDesc}>
                {isPendingDeletion ? t.cancelDesc : t.deleteDesc}
              </p>
            </div>
            
            {isPendingDeletion ? (
              <Button 
                variant="outline"
                onClick={() => cancelDeletionMutation.mutate({})}
                disabled={cancelDeletionMutation.isPending}
              >
                <Undo2 size={18} />
                {cancelDeletionMutation.isPending ? t.processing : t.cancelDeletion}
              </Button>
            ) : (
              <Dialog open={isDeletionDialogOpen} onOpenChange={setIsDeletionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 size={18} />
                    {t.deleteAccount}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className={styles.dialogTitle}>
                      <AlertTriangle className={styles.warningIcon} size={24} />
                      {t.confirmDeleteTitle}
                    </DialogTitle>
                    <DialogDescription>
                      {t.confirmDeleteDesc}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsDeletionDialogOpen(false)}
                    >
                      {t.cancel}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => deleteMutation.mutate({ notes: "User requested via settings" })}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? t.processing : t.confirm}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}