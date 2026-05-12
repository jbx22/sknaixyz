import React from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { usePortfolio } from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { Separator } from "./Separator";
import styles from "./PortfolioOverview.module.css";

interface PortfolioOverviewProps {
  compact?: boolean;
  className?: string;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  compact = false,
  className,
}) => {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].portfolio;
  const commonT = tokenizationTranslations[language].common;

  const { data, isLoading } = usePortfolio();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <Skeleton className={styles.headerSkeleton} />
        <Skeleton className={styles.statsSkeleton} />
        <Skeleton className={styles.listSkeleton} />
      </div>
    );
  }

  const portfolio = data;
  const holdings = portfolio?.holdings || [];
  const hasHoldings = holdings.length > 0;
  
  // Show only top 3 holdings in compact mode
  const displayHoldings = compact ? holdings.slice(0, 3) : holdings;

  if (!portfolio || !hasHoldings) {
    return (
      <div className={`${styles.container} ${styles.emptyState} ${className || ""}`}>
        <div className={styles.emptyIcon}>
          <Briefcase size={48} />
        </div>
        <h3>{t.title}</h3>
        <p>{language === "ar" ? "ابدأ رحلتك الاستثمارية اليوم" : "Start your investment journey today"}</p>
        <Button asChild>
          <Link to="/invest">{tokenizationTranslations[language].offerings.browse}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t.title}</h3>
        {compact && (
          <Button variant="link" asChild className={styles.viewAllLink}>
            <Link to="/invest/portfolio">
              {commonT.viewDetails} <ArrowRight size={16} />
            </Link>
          </Button>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <PieChart size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>{t.stats.totalInvested}</span>
            <span className={styles.statValue}>
              {formatCurrency(portfolio.totalInvestedAll)}
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>{t.stats.currentValue}</span>
            <span className={styles.statValue}>
              {formatCurrency(portfolio.totalPortfolioValue)}
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarSign size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>{t.stats.totalIncome}</span>
            <span className={`${styles.statValue} ${styles.success}`}>
              +{formatCurrency(portfolio.totalIncomeAll)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.holdingsList}>
        <h4 className={styles.sectionTitle}>{t.holdings}</h4>
        {displayHoldings.map((holding) => (
          <div key={holding.holdingId} className={styles.holdingItem}>
            <div className={styles.holdingInfo}>
              <span className={styles.holdingName}>{holding.propertyTitle}</span>
              <span className={styles.holdingLocation}>{holding.propertyLocation}</span>
            </div>
            <div className={styles.holdingStats}>
              <div className={styles.holdingStat}>
                <span className={styles.miniLabel}>{t.table.value}</span>
                <span className={styles.miniValue}>{formatCurrency(holding.currentValue)}</span>
              </div>
              <div className={styles.holdingStat}>
                <span className={styles.miniLabel}>{t.table.ownership}</span>
                <span className={styles.miniValue}>{holding.ownershipPercentage.toFixed(4)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};