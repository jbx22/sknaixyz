import React from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import { MapPin, Building2, FileText } from "lucide-react";
import { useTokenOfferingDetails } from "../helpers/useTokenization";
import { tokenizationTranslations } from "../helpers/tokenizationTranslations";
import { useLanguage } from "../helpers/useLanguage";
import { TokenEconomics } from "../components/TokenEconomics";
import { InvestmentExecution } from "../components/InvestmentExecution";
import { SecondaryMarket } from "../components/SecondaryMarket";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { Separator } from "../components/Separator";
import styles from "./invest.offering.module.css";

export default function OfferingDetailsPage() {
  const [searchParams] = useSearchParams();
  const assetId = Number(searchParams.get("id"));
  const { language } = useLanguage();
  const t = tokenizationTranslations[language].offerings;

  const { data, isLoading } = useTokenOfferingDetails(assetId);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Skeleton className={styles.headerSkeleton} />
          <div className={styles.grid}>
            <Skeleton className={styles.mainSkeleton} />
            <Skeleton className={styles.sidebarSkeleton} />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.offering) {
    return <div className={styles.error}>Offering not found</div>;
  }

  const offering = data.offering;
  const imageUrl = offering.propertyImages?.[0] || "https://placehold.co/800x400?text=Property";

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{offering.propertyTitle} | SKNAI</title>
      </Helmet>

      <div className={styles.hero}>
        <img src={imageUrl} alt={offering.propertyTitle} className={styles.heroImage} />
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.badges}>
              <Badge variant="secondary">{offering.propertyType}</Badge>
              <Badge variant={offering.offeringStatus === "open" ? "success" : "outline"}>
                {t.status[offering.offeringStatus]}
              </Badge>
            </div>
            <h1 className={styles.title}>{offering.propertyTitle}</h1>
            <div className={styles.location}>
              <MapPin size={18} />
              <span>{offering.propertyLocation}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.mainContent}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Property Details</h2>
              <div className={styles.propertyStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Area</span>
                  <span className={styles.statValue}>{offering.areaSqm} m²</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Bedrooms</span>
                  <span className={styles.statValue}>{offering.bedrooms || "-"}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Bathrooms</span>
                  <span className={styles.statValue}>{offering.bathrooms || "-"}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Year Built</span>
                  <span className={styles.statValue}>{offering.yearBuilt || "-"}</span>
                </div>
              </div>
              <p className={styles.description}>{offering.propertyDescription || "No description available."}</p>
            </section>

            <Separator className={styles.separator} />

            <section className={styles.section}>
              <TokenEconomics offering={offering} />
            </section>

            <Separator className={styles.separator} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Secondary Market</h2>
              <SecondaryMarket assetId={offering.id} />
            </section>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.stickySidebar}>
              <InvestmentExecution offering={offering} />
              
              <div className={styles.documentsCard}>
                <h3 className={styles.docsTitle}>Documents</h3>
                <div className={styles.docList}>
                  {offering.valuationReportUrl && (
                    <a href={offering.valuationReportUrl} target="_blank" rel="noreferrer" className={styles.docLink}>
                      <FileText size={16} />
                      <span>{t.details.valuationReport}</span>
                    </a>
                  )}
                  {offering.titleDeedUrl && (
                    <a href={offering.titleDeedUrl} target="_blank" rel="noreferrer" className={styles.docLink}>
                      <FileText size={16} />
                      <span>{t.details.titleDeed}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}