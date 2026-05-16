import React from "react";
import { Link } from "react-router-dom";
import { Plus, LayoutGrid, ArrowRight, Settings, FileText } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../helpers/useAuth";
import { useLanguage } from "../helpers/useLanguage";
import { dashboardTranslations } from "../helpers/dashboardTranslations";
import { useMyTokenizationRequests } from "../helpers/useTokenizationRequests";
import { UserStats } from "../components/UserStats";
import { UserFavorites } from "../components/UserFavorites";
import { PropertyCard } from "../components/PropertyCard";
import { PortfolioOverview } from "../components/PortfolioOverview";
import { InvestorHub } from "../components/InvestorHub";
import { usePropertiesQuery } from "../helpers/usePropertiesQuery";
import { RentDashboardWidget } from "../components/RentDashboardWidget";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { authState } = useAuth();
  const { language } = useLanguage();
  const t = dashboardTranslations[language];

  // We need to fetch the user's properties here for the "My Properties" section
  // The "My Favorites" section is handled by UserFavorites component
  const { data: myPropertiesData, isLoading: isLoadingProperties } =
    usePropertiesQuery({
      page: 1,
      pageSize: 20,
      userId: authState.type === "authenticated" ? authState.user.id : undefined,
    });

  const { data: tokenizationData, isLoading: isLoadingTokenization } =
    useMyTokenizationRequests(1, 5);

  if (authState.type !== "authenticated") {
    return null; // ProtectedRoute handles redirect
  }

  const user = authState.user;

  const getTokenizationStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      case "under_review":
        return "secondary";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const tokenizationTitle =
    language === "ar" ? "طلبات التحويل للاستثمار" : "Tokenization Requests";
  const noTokenizationRequests =
    language === "ar"
      ? "لم تقدم أي طلبات تحويل بعد"
      : "No tokenization requests yet";
  const browseForTokenization =
    language === "ar"
      ? "تصفح عقاراتك للتقديم"
      : "Browse your properties to apply";

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.welcome}>
            {t.welcome}, {user.displayName}
          </h1>
          <p className={styles.subtitle}>{t.dashboardSubtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <Button className={styles.addButton} asChild>
            <Link to="/add-property">
              <Plus size={18} />
              {t.addProperty}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/account-settings">
              <Settings size={18} />
              {t.accountSettings}
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.quickStats}</h2>
        <UserStats />
      </section>

      {/* Rent Summary */}
      <section className={styles.section}>
        <RentDashboardWidget />
      </section>

      {/* Investments Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {language === "ar" ? "الاستثمارات" : "Investments"}
          </h2>
          <Link to="/invest/portfolio" className={styles.viewAllLink}>
            {t.viewAll} <ArrowRight size={16} />
          </Link>
        </div>
        <PortfolioOverview compact />
      </section>

      {/* Tokenization Requests Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{tokenizationTitle}</h2>
          {/* Currently no dedicated page for requests list, so we omit view all or link to properties */}
        </div>

        {isLoadingTokenization ? (
          <div className={styles.requestsGrid}>
            {[1, 2].map((i) => (
              <div key={i} className={styles.requestSkeleton}>
                <Skeleton className={styles.requestSkeletonTitle} />
                <Skeleton className={styles.requestSkeletonBadge} />
              </div>
            ))}
          </div>
        ) : tokenizationData?.requests.length === 0 ? (
          <div className={styles.emptyRequests}>
            <FileText size={32} className={styles.emptyIcon} />
            <p>{noTokenizationRequests}</p>
            <Button variant="link" size="sm" asChild>
              <Link to="/my-properties">{browseForTokenization}</Link>
            </Button>
          </div>
        ) : (
          <div className={styles.requestsGrid}>
            {tokenizationData?.requests.map((request) => (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.requestInfo}>
                  <h3 className={styles.requestTitle}>{request.propertyTitle}</h3>
                  <span className={styles.requestDate}>
                    {format(new Date(request.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <Badge variant={getTokenizationStatusVariant(request.status)}>
                  {request.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Investor Hub Section */}
      <InvestorHub />

      {/* My Properties Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.myProperties}</h2>
          <Link to="/my-properties" className={styles.viewAllLink}>
            {t.viewAll} <ArrowRight size={16} />
          </Link>
        </div>

        {isLoadingProperties ? (
          <div className={styles.grid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton className={styles.skeletonImage} />
                <Skeleton className={styles.skeletonText} />
                <Skeleton className={styles.skeletonTextShort} />
              </div>
            ))}
          </div>
        ) : myPropertiesData?.properties.length === 0 ? (
          <div className={styles.emptyState}>
            <LayoutGrid size={48} className={styles.emptyIcon} />
            <p>{t.noProperties}</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/add-property">{t.addProperty}</Link>
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {myPropertiesData?.properties.slice(0, 3).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* My Favorites Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.myFavorites}</h2>
          <Link to="/favorites" className={styles.viewAllLink}>
            {t.viewAll} <ArrowRight size={16} />
          </Link>
        </div>
        <UserFavorites limit={3} />
      </section>
    </div>
  );
}