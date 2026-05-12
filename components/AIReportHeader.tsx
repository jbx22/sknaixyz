import React from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
import { Button } from "./Button";
import { Logo } from "./Logo";
import {
  Sparkles,
  Printer,
  Mail,
  Share2,
  FileDown,
  Lightbulb,
} from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import { t } from "../helpers/aiReportTranslations";
import styles from "./AIReportHeader.module.css";

interface AIReportHeaderProps {
  propertyTitle: string;
  canPrint: boolean;
  canEmail: boolean;
  canShareWhatsApp: boolean;
  canExportPDF: boolean;
  isPending: boolean;
  emailIsPending: boolean;
  onPrint: () => void;
  onEmail: () => void;
  onWhatsAppShare: () => void;
  onExportPDF: () => void;
  hasReport: boolean;
}

export const AIReportHeader: React.FC<AIReportHeaderProps> = ({
  propertyTitle,
  canPrint,
  canEmail,
  canShareWhatsApp,
  canExportPDF,
  isPending,
  emailIsPending,
  onPrint,
  onEmail,
  onWhatsAppShare,
  onExportPDF,
  hasReport,
}) => {
  const { language } = useLanguage();

  return (
    <>
      <DialogHeader className={styles.noPrint}>
        <div className={styles.headerRow}>
          <div>
            <DialogTitle className={styles.dialogTitle}>
              <Sparkles className={styles.titleIcon} size={24} />
              {t("dialogTitle", language)}
            </DialogTitle>
            <DialogDescription>
              {t("dialogDescription", language)} {propertyTitle}
            </DialogDescription>
          </div>
          {hasReport && (
            <div className={styles.actionButtons}>
              {canExportPDF ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportPDF}
                  disabled={isPending}
                >
                  <FileDown size={16} />
                  {t("pdf", language)}
                </Button>
              ) : null}
              {canPrint ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrint}
                  disabled={isPending}
                >
                  <Printer size={16} />
                  {t("print", language)}
                </Button>
              ) : null}
              {canShareWhatsApp ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onWhatsAppShare}
                >
                  <Share2 size={16} />
                  {t("whatsapp", language)}
                </Button>
              ) : null}
              {canEmail ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEmail}
                  disabled={emailIsPending}
                >
                  <Mail size={16} />
                  {emailIsPending ? t("sending", language) : t("email", language)}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </DialogHeader>

      {hasReport && (
        <>
          <div className={styles.printHeader}>
            <Logo size="md" variant="full" />
            <div className={styles.printTitle}>
              <h1>{t("propertyAIReport", language)}</h1>
              <p>{propertyTitle}</p>
            </div>
          </div>

          {!canPrint && !canEmail && (
            <div className={styles.upgradeNotice}>
              <Lightbulb size={20} />
              <p>{t("upgradeNotice", language)}</p>
            </div>
          )}
        </>
      )}
    </>
  );
};