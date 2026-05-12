import React from "react";
import { Check, X } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import { SUBSCRIPTION_STRINGS } from "../helpers/subscriptionTranslations";
import styles from "./FeaturesComparisonTable.module.css";

interface FeaturesComparisonTableProps {
  className?: string;
}

export const FeaturesComparisonTable = ({ className }: FeaturesComparisonTableProps) => {
  const { language } = useLanguage();
  const t = SUBSCRIPTION_STRINGS[language];

  const features = [
    {
      name: t.comparison.propertyListings,
      free: "1",
      basic: "10",
      premium: t.comparison.unlimited,
    },
    {
      name: t.comparison.aiReports,
      free: "5",
      basic: "30",
      premium: "100",
    },
    {
      name: t.commonFeatures.shareReports,
      free: false,
      basic: true,
      premium: true,
    },
    {
      name: t.commonFeatures.exportPdf,
      free: false,
      basic: true,
      premium: true,
    },
    {
      name: t.commonFeatures.emailReports,
      free: false,
      basic: false,
      premium: true,
    },
    {
      name: t.commonFeatures.featuredListings,
      free: false,
      basic: false,
      premium: true,
    },
    {
      name: t.commonFeatures.tokenizedInvestments,
      free: false,
      basic: true,
      premium: true,
    },
    {
      name: t.commonFeatures.secondaryMarketTrading,
      free: false,
      basic: false,
      premium: true,
    },
    {
      name: t.commonFeatures.incomeDistributions,
      free: false,
      basic: true,
      premium: true,
    },
  ];

  const renderCell = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check size={20} className={styles.checkIcon} />
      ) : (
        <X size={20} className={styles.xIcon} />
      );
    }
    return <span className={styles.valueText}>{value}</span>;
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <h2 className={styles.title}>{t.comparison.featuresTableTitle}</h2>
      
      {/* Desktop Table */}
      <div className={styles.desktopTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>{t.comparison.feature}</th>
              <th className={styles.headerCell}>{t.tiers.free.name}</th>
              <th className={styles.headerCell}>{t.tiers.basic.name}</th>
              <th className={`${styles.headerCell} ${styles.premiumHeader}`}>
                {t.tiers.premium.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, idx) => (
              <tr key={idx} className={styles.row}>
                <td className={styles.featureCell}>{feature.name}</td>
                <td className={styles.valueCell}>{renderCell(feature.free)}</td>
                <td className={styles.valueCell}>{renderCell(feature.basic)}</td>
                <td className={`${styles.valueCell} ${styles.premiumCell}`}>
                  {renderCell(feature.premium)}
                </td>
              </tr>
            ))}
            <tr className={styles.extraRow}>
              <td className={styles.featureCell}>
                {language === "ar" ? "تقارير إضافية" : "Extra Reports"}
              </td>
              <td className={styles.valueCell}>
                <span className={styles.extraReportsText}>
                  {t.extraReports.extraReportPrice} / {language === "ar" ? "تقرير" : "report"}
                </span>
              </td>
              <td className={styles.valueCell}>
                <span className={styles.extraReportsText}>
                  {t.extraReports.extraReportPrice} / {language === "ar" ? "تقرير" : "report"}
                </span>
              </td>
              <td className={`${styles.valueCell} ${styles.premiumCell}`}>
                <span className={styles.extraReportsText}>
                  {t.extraReports.extraReportPricePremium} / {language === "ar" ? "تقرير" : "report"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={styles.mobileCards}>
        {[
          { tier: "free", name: t.tiers.free.name, data: features.map((f) => f.free) },
          { tier: "basic", name: t.tiers.basic.name, data: features.map((f) => f.basic) },
          { tier: "premium", name: t.tiers.premium.name, data: features.map((f) => f.premium) },
        ].map((tierData) => (
          <div
            key={tierData.tier}
            className={`${styles.mobileCard} ${
              tierData.tier === "premium" ? styles.premiumCard : ""
            }`}
          >
            <h3 className={styles.mobileCardTitle}>{tierData.name}</h3>
            <div className={styles.mobileCardFeatures}>
              {features.map((feature, idx) => (
                <div key={idx} className={styles.mobileFeatureRow}>
                  <span className={styles.mobileFeatureName}>{feature.name}</span>
                  <div className={styles.mobileFeatureValue}>
                    {renderCell(tierData.data[idx])}
                  </div>
                </div>
              ))}
              <div className={styles.mobileFeatureRow}>
                <span className={styles.mobileFeatureName}>
                  {language === "ar" ? "تقارير إضافية" : "Extra Reports"}
                </span>
                <span className={styles.extraReportsText}>
                  {tierData.tier === "premium"
                    ? t.extraReports.extraReportPricePremium
                    : t.extraReports.extraReportPrice}{" "}
                  / {language === "ar" ? "تقرير" : "report"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};