import React from "react";
import { TrendingUp, Construction } from "lucide-react";
import { Badge } from "./Badge";
import { AIReport } from "../endpoints/properties/ai_report_POST.schema";
import { useLanguage } from "../helpers/useLanguage";
import { t } from "../helpers/aiReportTranslations";
import styles from "./AIReportInvestment.module.css";

interface AIReportInvestmentProps {
  report: AIReport;
}

export const AIReportInvestment: React.FC<AIReportInvestmentProps> = ({
  report,
}) => {
  const { language } = useLanguage();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <div className={`${styles.section} ${styles.investmentSection}`}>
        <h4 className={styles.sectionTitle}>
          <TrendingUp size={18} />
          {t("investmentAnalysis", language)}
        </h4>
        <div className={styles.investmentGrid}>
          <div className={styles.investmentCard}>
            <span className={styles.investmentLabel}>{t("pricePerSqm", language)}</span>
            <span className={styles.investmentValue}>
              {formatPrice(report.pricePerSqm)}
            </span>
          </div>
          <div className={styles.investmentCard}>
            <span className={styles.investmentLabel}>{t("areaAverage", language)}</span>
            <span className={styles.investmentValue}>
              {formatPrice(report.areaPricePerSqmAvg)}
            </span>
          </div>
          <div className={styles.investmentCard}>
            <span className={styles.investmentLabel}>{t("rentalYield", language)}</span>
            <span className={styles.investmentValue}>
              {report.rentalYieldEstimate}%
            </span>
            <Badge
              variant={report.rentalYieldEstimate >= 5 ? "success" : "warning"}
              className={styles.yieldBadge}
            >
              {report.rentalYieldEstimate >= 5 ? t("high", language) : t("moderate", language)}
            </Badge>
          </div>
        </div>
      </div>

      {report.futureDevelopments.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <Construction size={18} />
            {t("futureDevelopments", language)}
          </h4>
          <ul className={styles.developmentList}>
            {report.futureDevelopments.map((dev, i) => (
              <li key={i}>{dev}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};