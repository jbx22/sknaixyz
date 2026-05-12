import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useKYCStatus, useSubmitKYC } from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import styles from "./KYCForm.module.css";

// Schema matching the endpoint input
const kycSchema = z.object({
  nationalId: z.string().min(1, "National ID is required"),
  fullNameAr: z.string().min(1, "Arabic name is required"),
  fullNameEn: z.string().min(1, "English name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"), // Input type="date" returns string
  nationality: z.string().min(1, "Nationality is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type KYCFormData = z.infer<typeof kycSchema>;

interface KYCFormProps {
  onComplete?: () => void;
  className?: string;
}

export const KYCForm: React.FC<KYCFormProps> = ({ onComplete, className }) => {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].kyc;
  const commonT = tokenizationTranslations[language].common;

  const { data: statusData, isLoading: isLoadingStatus } = useKYCStatus();
  const { mutate: submitKYC, isPending: isSubmitting } = useSubmitKYC();

  const kycRecord = statusData?.kyc;
  const status = kycRecord?.status;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      nationality: "Saudi",
    },
  });

  // Reset form if rejected to allow editing, or pre-fill if needed
  useEffect(() => {
    if (status === "rejected" && kycRecord) {
      reset({
        nationalId: kycRecord.nationalId || "",
        fullNameAr: kycRecord.fullNameAr || "",
        fullNameEn: kycRecord.fullNameEn || "",
        // Format date for input type="date" (YYYY-MM-DD)
        dateOfBirth: kycRecord.dateOfBirth
          ? new Date(kycRecord.dateOfBirth).toISOString().split("T")[0]
          : "",
        nationality: kycRecord.nationality || "Saudi",
        address: kycRecord.address || "",
        phone: kycRecord.phone || "",
      });
    }
  }, [status, kycRecord, reset]);

  const onSubmit = (data: KYCFormData) => {
    submitKYC(
      {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
      },
      {
        onSuccess: () => {
          toast.success(commonT.success);
          if (onComplete) onComplete();
        },
        onError: (error) => {
          toast.error(error.message || commonT.error);
        },
      }
    );
  };

  if (isLoadingStatus) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <Skeleton className={styles.skeletonHeader} />
        <div className={styles.skeletonForm}>
          <Skeleton className={styles.skeletonInput} />
          <Skeleton className={styles.skeletonInput} />
          <Skeleton className={styles.skeletonInput} />
        </div>
      </div>
    );
  }

  const renderStatusBadge = () => {
    if (!status) return null;

    switch (status) {
      case "approved":
        return (
          <div className={`${styles.statusContainer} ${styles.approved}`}>
            <ShieldCheck size={48} className={styles.statusIcon} />
            <h3>{t.status.approved}</h3>
            {kycRecord?.verifiedAt && (
              <p className={styles.verifiedDate}>
                {new Date(kycRecord.verifiedAt).toLocaleDateString(
                  language === "ar" ? "ar-SA" : "en-US"
                )}
              </p>
            )}
          </div>
        );
      case "pending":
        return (
          <div className={`${styles.statusContainer} ${styles.pending}`}>
            <Clock size={48} className={styles.statusIcon} />
            <h3>{t.status.pending}</h3>
            <p>{commonT.pending}</p>
          </div>
        );
      case "rejected":
        return (
          <div className={`${styles.statusContainer} ${styles.rejected}`}>
            <ShieldAlert size={48} className={styles.statusIcon} />
            <h3>{t.status.rejected}</h3>
            {kycRecord?.rejectionReason && (
              <p className={styles.rejectionReason}>
                {kycRecord.rejectionReason}
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => reset()} // Logic handled by effect but button gives visual cue
              className={styles.retryButton}
            >
              {commonT.submit}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // If approved or pending, just show status. If rejected, show status + form below (or replace).
  // Requirement says: "If rejected, show rejection reason and allow resubmission"
  // So we show the form if status is null (new) or rejected.

  const showForm = !status || status === "rejected";

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t.title}</h2>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>

      {status && (
        <div className={styles.statusSection}>{renderStatusBadge()}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>{t.form.nationalId}</label>
              <Input
                {...register("nationalId")}
                placeholder="1xxxxxxxxx"
                className={errors.nationalId ? styles.inputError : ""}
              />
              {errors.nationalId && (
                <span className={styles.errorMsg}>
                  {errors.nationalId.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.form.fullNameAr}</label>
              <Input
                {...register("fullNameAr")}
                className={errors.fullNameAr ? styles.inputError : ""}
                dir="rtl"
              />
              {errors.fullNameAr && (
                <span className={styles.errorMsg}>
                  {errors.fullNameAr.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.form.fullNameEn}</label>
              <Input
                {...register("fullNameEn")}
                className={errors.fullNameEn ? styles.inputError : ""}
                dir="ltr"
              />
              {errors.fullNameEn && (
                <span className={styles.errorMsg}>
                  {errors.fullNameEn.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.form.dateOfBirth}</label>
              <Input
                type="date"
                {...register("dateOfBirth")}
                className={errors.dateOfBirth ? styles.inputError : ""}
              />
              {errors.dateOfBirth && (
                <span className={styles.errorMsg}>
                  {errors.dateOfBirth.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.form.nationality}</label>
              <Input
                {...register("nationality")}
                className={errors.nationality ? styles.inputError : ""}
              />
              {errors.nationality && (
                <span className={styles.errorMsg}>
                  {errors.nationality.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.form.phone}</label>
              <Input
                {...register("phone")}
                placeholder="+966..."
                className={errors.phone ? styles.inputError : ""}
                dir="ltr"
              />
              {errors.phone && (
                <span className={styles.errorMsg}>{errors.phone.message}</span>
              )}
            </div>

            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label}>{t.form.address}</label>
              <Textarea
                {...register("address")}
                className={errors.address ? styles.inputError : ""}
              />
              {errors.address && (
                <span className={styles.errorMsg}>
                  {errors.address.message}
                </span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={styles.spinner} size={16} />
                  {commonT.loading}
                </>
              ) : (
                t.form.submit
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};