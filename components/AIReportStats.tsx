import React from "react";
import {
  ShieldCheck,
  TrendingUp,
  Footprints,
  BarChart3,
  Volume2,
  Wind,
  Car,
  UtensilsCrossed,
} from "lucide-react";
import { Progress } from "./Progress";
import { Badge } from "./Badge";
import { AIReport } from "../endpoints/properties/ai_report_POST.schema";
import { useLanguage } from "../helpers/useLanguage";
import { t } from "../helpers/aiReportTranslations";
import styles from "./AIReportStats.module.css";

interface AIReportStatsProps {
  report: AIReport;
}

export const AIReportStats: React.FC<AIReportStatsProps> = ({ report }) => {
  const { language } = useLanguage();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getRatingColor = (
    rating: number
  ): "success" | "warning" | "destructive" => {
    if (rating >= 7) return "success";
    if (rating >= 5) return "warning";
    return "destructive";
  };

  const getRatingLabel = (rating: number): string => {
    if (rating >= 7) return t("excellent", language);
    if (rating >= 5) return t("good", language);
    return t("fair", language);
  };

  const getAQILabel = (aqi: number): string => {
    if (aqi <= 50) return t("good", language);
    if (aqi <= 100) return t("moderate", language);
    return t("poor", language);
  };

  const getAQIColor = (aqi: number): "success" | "warning" | "destructive" => {
    if (aqi <= 50) return "success";
    if (aqi <= 100) return "warning";
    return "destructive";
  };

  return (
    <>
      <div className={styles.mainStats}>
        <div className={`${styles.statCard} ${styles.highlightCard}`}>
          <div className={styles.statHeader}>
            <ShieldCheck size={18} className={styles.statIcon} />
            <span>{t("safetyRating", language)}</span>
          </div>
          <div className={styles.ratingValue}>{report.safetyRating}/10</div>
          <Badge
            variant={getRatingColor(report.safetyRating)}
            className={styles.ratingBadge}
          >
            {getRatingLabel(report.safetyRating)}
          </Badge>
          <Progress value={report.safetyRating * 10} />
        </div>

        <div className={`${styles.statCard} ${styles.highlightCard}`}>
          <div className={styles.statHeader}>
            <TrendingUp size={18} className={styles.statIcon} />
            <span>{t("marketPrediction", language)}</span>
          </div>
          <div className={styles.priceValue}>
            {formatPrice(report.marketPricePrediction.estimatedValue)}
          </div>
          <div className={styles.priceMeta}>
            <Badge variant="secondary" className={styles.priceBadge}>
              {report.marketPricePrediction.priceStatus}
            </Badge>
            <span className={styles.confidence}>
              {report.marketPricePrediction.confidence}% {t("confidence", language)}
            </span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.highlightCard}`}>
          <div className={styles.statHeader}>
            <Footprints size={18} className={styles.statIcon} />
            <span>{t("walkability", language)}</span>
          </div>
          <div className={styles.ratingValue}>{report.walkabilityScore}/10</div>
          <Badge
            variant={getRatingColor(report.walkabilityScore)}
            className={styles.ratingBadge}
          >
            {getRatingLabel(report.walkabilityScore)}
          </Badge>
          <Progress value={report.walkabilityScore * 10} />
        </div>

        <div className={`${styles.statCard} ${styles.highlightCard}`}>
          <div className={styles.statHeader}>
            <BarChart3 size={18} className={styles.statIcon} />
            <span>{t("investmentPotential", language)}</span>
          </div>
          <div className={styles.ratingValue}>
            {report.investmentPotentialScore}/10
          </div>
          <Badge
            variant={getRatingColor(report.investmentPotentialScore)}
            className={styles.ratingBadge}
          >
            {getRatingLabel(report.investmentPotentialScore)}
          </Badge>
          <Progress value={report.investmentPotentialScore * 10} />
        </div>
      </div>

      <div className={styles.quickStats}>
        <div className={styles.quickStat}>
          <Volume2 size={16} />
          <div>
            <span className={styles.quickStatLabel}>{t("noiseLevel", language)}</span>
            <span className={styles.quickStatValue}>
              {report.noiseLevel}/10
            </span>
            <Progress
              value={report.noiseLevel * 10}
              className={styles.miniProgress}
            />
          </div>
        </div>
        <div className={styles.quickStat}>
          <Wind size={16} />
          <div>
            <span className={styles.quickStatLabel}>{t("airQuality", language)}</span>
            <span className={styles.quickStatValue}>
              {report.airQualityIndex} AQI
            </span>
            <Badge
              variant={getAQIColor(report.airQualityIndex)}
              className={styles.miniBadge}
            >
              {getAQILabel(report.airQualityIndex)}
            </Badge>
          </div>
        </div>
        <div className={styles.quickStat}>
          <Car size={16} />
          <div>
            <span className={styles.quickStatLabel}>{t("traffic", language)}</span>
            <span className={styles.quickStatValue}>
              {report.trafficConditions}
            </span>
          </div>
        </div>
        <div className={styles.quickStat}>
          <UtensilsCrossed size={16} />
          <div>
            <span className={styles.quickStatLabel}>{t("restaurants", language)}</span>
            <span className={styles.quickStatValue}>
              {report.nearestRestaurants}+ {t("nearby", language)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};