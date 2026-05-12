import React from "react";
import {
  PieChart,
  Coins,
  Calendar,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Building,
} from "lucide-react";
import { OfferingDetails } from "../endpoints/tokenization/offerings/details_GET.schema";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { Progress } from "./Progress";
import { Separator } from "./Separator";
import styles from "./TokenEconomics.module.css";

interface TokenEconomicsProps {
  offering: OfferingDetails;
  showFull?: boolean;
  className?: string;
}

export const TokenEconomics: React.FC<TokenEconomicsProps> = ({
  offering,
  showFull = true,
  className,
}) => {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].offerings.details;
  const commonT = tokenizationTranslations[language].common;
  const riskT = tokenizationTranslations[language].investment;

  const percentSold =
    offering.totalTokens > 0
      ? Math.round((offering.tokensSold / offering.totalTokens) * 100)
      : 0;

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <h3 className={styles.heading}>Token Economics</h3>
      
      <div className={styles.grid}>
        {/* Main Stats */}
        <div className={styles.card}>
          <div className={styles.statGroup}>
            <span className={styles.label}>{t.totalTokens}</span>
            <span className={styles.value}>{offering.totalTokens.toLocaleString()}</span>
          </div>
          <Separator className={styles.separator} />
          <div className={styles.statGroup}>
            <span className={styles.label}>{t.tokenPrice}</span>
            <span className={styles.value}>{formatCurrency(offering.tokenPrice)}</span>
          </div>
          <Separator className={styles.separator} />
          <div className={styles.statGroup}>
            <span className={styles.label}>Total Asset Value</span>
            <span className={styles.value}>{formatCurrency(offering.totalValue)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className={styles.card}>
          <div className={styles.progressHeader}>
            <span className={styles.label}>{t.fundingProgress}</span>
            <span className={styles.percent}>{percentSold}%</span>
          </div>
          <Progress value={percentSold} className={styles.progress} />
          <div className={styles.progressDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{t.tokensSold}</span>
              <span className={styles.detailValue}>{offering.tokensSold.toLocaleString()}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{t.availableTokens}</span>
              <span className={styles.detailValue}>{offering.availableTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <PieChart className={styles.icon} size={20} />
            <span className={styles.metricLabel}>{t.annualYield}</span>
            <span className={styles.metricValue}>
              {offering.annualRentalYield ? `${offering.annualRentalYield}%` : "N/A"}
            </span>
          </div>
          <div className={styles.metricCard}>
            <Calendar className={styles.icon} size={20} />
            <span className={styles.metricLabel}>{t.lockUpPeriod}</span>
            <span className={styles.metricValue}>{offering.lockUpDays} {commonT.days}</span>
          </div>
          <div className={styles.metricCard}>
            <Coins className={styles.icon} size={20} />
            <span className={styles.metricLabel}>{t.incomeRights}</span>
            <span className={styles.metricValue}>
              {offering.incomeRights ? commonT.success : commonT.failed}
            </span>
          </div>
          <div className={styles.metricCard}>
            <ShieldCheck className={styles.icon} size={20} />
            <span className={styles.metricLabel}>{t.votingRights}</span>
            <span className={styles.metricValue}>
              {offering.votingRights ? commonT.success : commonT.failed}
            </span>
          </div>
        </div>

        {/* SPV Info */}
        {showFull && (
          <div className={styles.spvCard}>
            <div className={styles.spvHeader}>
              <Building className={styles.spvIcon} size={20} />
              <h4>SPV Structure</h4>
            </div>
            <div className={styles.spvDetails}>
              <div className={styles.spvRow}>
                <span>Name</span>
                <span>{offering.spvName}</span>
              </div>
              <div className={styles.spvRow}>
                <span>Registration</span>
                <span>{offering.spvRegistrationNumber || "Pending"}</span>
              </div>
              <div className={styles.spvRow}>
                <span>Structure</span>
                <span>{offering.spvLegalStructure || "LLC"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Risk Disclosure */}
      <div className={styles.riskSection}>
        <div className={styles.riskHeader}>
          <AlertTriangle size={18} />
          <h4>{riskT.riskDisclosure}</h4>
        </div>
        <ul className={styles.riskList}>
          <li>{riskT.noGuarantee}</li>
          <li>{riskT.assetBacked}</li>
          <li>Investment involves risk. Past performance is not indicative of future results.</li>
        </ul>
      </div>
    </div>
  );
};