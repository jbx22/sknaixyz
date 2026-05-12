import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  TrendingUp,
  Clock,
  Vote,
  Coins,
  ArrowRight,
} from "lucide-react";
import { OfferingListItem } from "../endpoints/tokenization/offerings/list_GET.schema";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Progress } from "./Progress";
import styles from "./TokenOfferingCard.module.css";

interface TokenOfferingCardProps {
  offering: OfferingListItem;
  compact?: boolean;
  className?: string;
}

export const TokenOfferingCard: React.FC<TokenOfferingCardProps> = ({
  offering,
  compact = false,
  className,
}) => {
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].offerings;
  const commonT = tokenizationTranslations[language].common;

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

  const imageUrl =
    offering.propertyImages && offering.propertyImages.length > 0
      ? offering.propertyImages[0]
      : "https://placehold.co/600x400?text=Property";

  return (
    <div className={`${styles.card} ${className || ""}`}>
      <div className={styles.imageContainer}>
        <img
          src={imageUrl}
          alt={offering.propertyTitle}
          className={styles.image}
        />
        <div className={styles.badges}>
          <Badge variant="secondary" className={styles.typeBadge}>
            {offering.propertyType}
          </Badge>
          <Badge
            variant={offering.offeringStatus === "open" ? "success" : "outline"}
            className={styles.statusBadge}
          >
            {t.status[offering.offeringStatus]}
          </Badge>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{offering.propertyTitle}</h3>
          <div className={styles.location}>
            <MapPin size={14} />
            <span>{offering.propertyLocation}</span>
          </div>
        </div>

        <div className={styles.economics}>
          <div className={styles.ecoRow}>
            <span className={styles.ecoLabel}>{t.details.tokenPrice}</span>
            <span className={styles.ecoValue}>
              {formatCurrency(offering.tokenPrice)}
            </span>
          </div>
          
          {!compact && (
            <>
              <div className={styles.ecoRow}>
                <span className={styles.ecoLabel}>{t.details.annualYield}</span>
                <span className={`${styles.ecoValue} ${styles.highlight}`}>
                  {offering.annualRentalYield ? `${offering.annualRentalYield}%` : "N/A"}
                </span>
              </div>
              <div className={styles.ecoRow}>
                <span className={styles.ecoLabel}>{t.details.lockUpPeriod}</span>
                <span className={styles.ecoValue}>
                  {offering.lockUpDays} {commonT.days}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressLabels}>
            <span>{t.details.fundingProgress}</span>
            <span>{percentSold}%</span>
          </div>
          <Progress value={percentSold} className={styles.progressBar} />
          <div className={styles.progressStats}>
            <span>
              {offering.tokensSold} / {offering.totalTokens} {commonT.tokens}
            </span>
          </div>
        </div>

        {!compact && (
          <div className={styles.features}>
            {offering.incomeRights && (
              <div className={styles.feature} title={t.details.incomeRights}>
                <Coins size={16} />
                <span>{t.details.incomeRights}</span>
              </div>
            )}
            {offering.votingRights && (
              <div className={styles.feature} title={t.details.votingRights}>
                <Vote size={16} />
                <span>{t.details.votingRights}</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <Button asChild className={styles.investButton}>
            <Link to={`/invest/offering?id=${offering.id}`}>
              {t.invest}
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};