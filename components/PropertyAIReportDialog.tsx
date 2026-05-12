import React, { useEffect } from "react";
import { Dialog, DialogContent } from "./Dialog";
import { useAIReport } from "../helpers/useAIReport";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { useAuth } from "../helpers/useAuth";
import { usePrintReport } from "../helpers/usePrintReport";
import { useWhatsAppShare } from "../helpers/useWhatsAppShare";
import { usePDFExport } from "../helpers/usePDFExport";
import { useMutation } from "@tanstack/react-query";
import { emailAIReport } from "../endpoints/properties/email_report_POST.schema";
import { toast } from "sonner";
import { useLanguage } from "../helpers/useLanguage";
import { t } from "../helpers/aiReportTranslations";
import { tDialog } from "../helpers/aiReportDialogMessages";
import { BuyReportsDialog } from "./BuyReportsDialog";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { AIReportHeader } from "./AIReportHeader";

// Import sub-components
import { AIReportStats } from "./AIReportStats";
import { AIReportCharts } from "./AIReportCharts";
import { AIReportInvestment } from "./AIReportInvestment";
import { AIReportAmenities } from "./AIReportAmenities";
import { AiReportStatus } from "../helpers/schema";

import styles from "./PropertyAIReportDialog.module.css";

interface PropertyAIReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  propertyTitle: string;
  aiReportStatus?: AiReportStatus | null;
}

export const PropertyAIReportDialog: React.FC<PropertyAIReportDialogProps> = ({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  aiReportStatus,
}) => {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const { mutate, data, isPending, error, isIdle } = useAIReport();
  const { printReport } = usePrintReport();
  const { shareReport } = useWhatsAppShare();
  const { exportToPDF } = usePDFExport();
  const [showBuyReports, setShowBuyReports] = React.useState(false);

  // Early return if not authenticated - don't even try to fetch
  const isAuthenticated = authState.type === "authenticated";
  const user = isAuthenticated ? authState.user : undefined;
  const report = data?.report;

  const canPrint =
    user?.role === "admin" ||
    (user && ["basic", "premium"].includes(user.subscriptionTier || ""));
  const canEmail =
    user?.role === "admin" || user?.subscriptionTier === "premium";
  const canExportPDF = canPrint;
  const canShareWhatsApp = canPrint;

  useEffect(() => {
    // Only fetch if authenticated
    if (open && isIdle && isAuthenticated) {
      mutate({ propertyId, language });
    }
  }, [open, isIdle, mutate, propertyId, language, isAuthenticated]);

  const emailMutation = useMutation({
    mutationFn: (recipientEmail: string) =>
      emailAIReport({ propertyId, recipientEmail }),
    onSuccess: (data) => {
      if ("message" in data) {
        toast.success(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEmailClick = () => {
    if (!canEmail) {
      toast.error(
        "Email functionality is only available for Premium subscribers"
      );
      return;
    }
    if (user?.email) {
      emailMutation.mutate(user.email);
    }
  };

  const handleWhatsAppShare = () => {
    if (!canShareWhatsApp) {
      toast.error("WhatsApp sharing is only available for Basic+ subscribers");
      return;
    }
    if (!report) return;

    shareReport({
      propertyTitle,
      safetyRating: report.safetyRating,
      walkabilityScore: report.walkabilityScore,
      investmentScore: report.investmentPotentialScore,
      estimatedValue: report.marketPricePrediction.estimatedValue,
    });
  };

  const handlePDFExport = async () => {
    if (!canExportPDF) {
      toast.error("PDF export is only available for Basic+ subscribers");
      return;
    }
    await exportToPDF(propertyTitle);
  };

  const isGenerating = aiReportStatus === "pending" || (!aiReportStatus && isPending);
  const isLoadingCached = aiReportStatus === "completed" && isPending;

  // Check for specific error types
  const isLimitError =
    error &&
    (error.message.toLowerCase().includes("limit") ||
      error.message.toLowerCase().includes("exceeded"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BuyReportsDialog open={showBuyReports} onOpenChange={setShowBuyReports} />
      <DialogContent className={styles.dialogContent}>
        <AIReportHeader
          propertyTitle={propertyTitle}
          canPrint={canPrint ?? false}
          canEmail={canEmail ?? false}
          canShareWhatsApp={canShareWhatsApp ?? false}
          canExportPDF={canExportPDF ?? false}
          isPending={isPending}
          emailIsPending={emailMutation.isPending}
          onPrint={printReport}
          onEmail={handleEmailClick}
          onWhatsAppShare={handleWhatsAppShare}
          onExportPDF={handlePDFExport}
          hasReport={!!report}
        />

        <div className={styles.body}>
          {/* Show login UI immediately if not authenticated */}
          {!isAuthenticated && (
            <div className={styles.limitState}>
              <div className={styles.iconCircle}>
                <LogIn size={32} />
              </div>
              <h3 className={styles.limitTitle}>
                {language === "ar"
                  ? "تسجيل الدخول مطلوب"
                  : "Login Required"}
              </h3>
              <p className={styles.limitDescription}>
                {language === "ar"
                  ? "يرجى تسجيل الدخول لإنشاء تقارير الذكاء الاصطناعي للعقارات"
                  : "Please login to generate AI reports for properties"}
              </p>
              <Button asChild>
                <Link to="/login">
                  {language === "ar" ? "تسجيل الدخول" : "Login"}
                </Link>
              </Button>
            </div>
          )}

          {isAuthenticated && isLoadingCached && (
            <div className={styles.loadingState}>
              <Loader2 className={styles.spinner} size={32} />
              <p>{tDialog("loadingReport", language)}</p>
            </div>
          )}

          {isAuthenticated && isPending && !isLoadingCached && (
            <div className={styles.loadingState}>
              <Loader2 className={styles.spinner} size={40} />
              <p>
                {isGenerating
                  ? tDialog("generatingReport", language)
                  : t("analyzingData", language)}
              </p>
              <div className={styles.skeletonSpace}>
                <div className={styles.skeletonLine} style={{ width: "80%" }} />
                <div className={styles.skeletonLine} style={{ width: "60%" }} />
                <div className={styles.skeletonLine} style={{ width: "90%" }} />
              </div>
            </div>
          )}

          {isAuthenticated && isLimitError && !report && (
            <div className={styles.limitState}>
              <div className={styles.iconCircle}>
                <AlertCircle size={32} />
              </div>
              <h3 className={styles.limitTitle}>
                {language === "ar"
                  ? "لقد وصلت إلى الحد الأقصى للتقارير"
                  : "You've reached your monthly AI report limit"}
              </h3>
              <p className={styles.limitDescription}>
                {language === "ar"
                  ? "قم بترقية باقتك للحصول على المزيد من التقارير أو شراء تقارير إضافية"
                  : "Upgrade your plan for more reports or purchase additional reports"}
              </p>
              <div className={styles.limitActions}>
                <Button asChild variant="outline">
                  <Link to="/subscription">
                    {language === "ar" ? "ترقية الباقة" : "Upgrade Plan"}
                  </Link>
                </Button>
                <Button onClick={() => setShowBuyReports(true)}>
                  {language === "ar" ? "شراء تقارير" : "Buy More Reports"}
                </Button>
              </div>
            </div>
          )}

          {isAuthenticated && error && !isLimitError && (
            <div className={styles.errorState}>
              <AlertCircle size={40} />
              <p>{t("failedToGenerate", language)}</p>
              <Button
                variant="outline"
                onClick={() => mutate({ propertyId, language })}
                size="sm"
              >
                {t("tryAgain", language)}
              </Button>
            </div>
          )}

          {isAuthenticated && report && (
            <div className={styles.reportContent} id="ai-report-content">
              {/* Report-specific print header (hidden on screen) */}
              <div className={styles.printHeader}>
                <Logo size="md" variant="full" />
                <div className={styles.printTitle}>
                  <h1>{t("propertyAIReport", language)}</h1>
                  <p>{propertyTitle}</p>
                </div>
              </div>

              <AIReportStats report={report} />

              <AIReportCharts report={report} />

              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>{t("areaAnalysis", language)}</h4>
                <div className={styles.analysisText}>
                  {report.areaAnalysis.split("\n\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <AIReportInvestment report={report} />

              <AIReportAmenities report={report} />

              {(user?.subscriptionTier === "free" || !user?.subscriptionTier) && (
                <div className={styles.upgradeNotice}>
                  <p>{tDialog("freeTierNote", language)}</p>
                </div>
              )}

              <div className={styles.printFooter}>
                <p>{t("generatedBy", language)}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};