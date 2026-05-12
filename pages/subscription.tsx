import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, X, Star, Zap, Shield, Building2, Brain, ShoppingCart } from "lucide-react";
import * as Progress from "@radix-ui/react-progress";
import { BuyReportsDialog } from "../components/BuyReportsDialog";
import { FeaturesComparisonTable } from "../components/FeaturesComparisonTable";

import { useAuth } from "../helpers/useAuth";
import { useSubscription } from "../helpers/useSubscription";
import { useLanguage } from "../helpers/useLanguage";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { SubscriptionTier } from "../helpers/schema";
import { SUBSCRIPTION_STRINGS } from "../helpers/subscriptionTranslations";

import styles from "./subscription.module.css";

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { language } = useLanguage();
  const { status, isLoading, upgrade, isUpgrading } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [buyReportsOpen, setBuyReportsOpen] = useState(false);

  const t = SUBSCRIPTION_STRINGS[language];
  const isAuthenticated = authState.type === "authenticated";

  // Dynamic TIERS generation based on language
  const TIERS = [
    {
      id: "free" as SubscriptionTier,
      name: t.tiers.free.name,
      price: t.tiers.free.price,
      period: t.tiers.free.period,
      description: t.tiers.free.description,
      propertyLimit: 1,
      isPopular: false,
      features: [
        { text: t.tiers.free.listingFeature, included: true },
        { text: t.tiers.free.aiReportFeature, included: true },
        { text: t.commonFeatures.viewReports, included: true },
        { text: t.commonFeatures.shareReports, included: false },
        { text: t.commonFeatures.exportPdf, included: false },
        { text: t.commonFeatures.emailReports, included: false },
        { text: t.commonFeatures.featuredListings, included: false },
      ],
    },
    {
      id: "basic" as SubscriptionTier,
      name: t.tiers.basic.name,
      price: t.tiers.basic.price,
      period: t.tiers.basic.period,
      description: t.tiers.basic.description,
      propertyLimit: 10,
      isPopular: false,
      features: [
        { text: t.tiers.basic.listingFeature, included: true },
        { text: t.tiers.basic.aiReportFeature, included: true },
        { text: t.commonFeatures.viewReports, included: true },
        { text: t.commonFeatures.shareReports, included: true },
        { text: t.commonFeatures.exportPdf, included: true },
        { text: t.commonFeatures.emailReports, included: false },
        { text: t.commonFeatures.featuredListings, included: false },
      ],
    },
    {
      id: "premium" as SubscriptionTier,
      name: t.tiers.premium.name,
      price: t.tiers.premium.price,
      period: t.tiers.premium.period,
      description: t.tiers.premium.description,
      propertyLimit: -1, // Unlimited
      isPopular: true,
      features: [
        { text: t.tiers.premium.listingFeature, included: true },
        { text: t.tiers.premium.aiReportFeature, included: true },
        { text: t.commonFeatures.viewReports, included: true },
        { text: t.commonFeatures.shareReports, included: true },
        { text: t.commonFeatures.exportPdf, included: true },
        { text: t.commonFeatures.emailReports, included: true },
        { text: t.commonFeatures.featuredListings, included: true },
      ],
    },
  ];

  const handleUpgrade = async (tier: SubscriptionTier) => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (isUpgrading || tier === "free") return;
    
    setSelectedTier(tier);
    try {
      await upgrade({
        tier: tier as "basic" | "premium",
        paymentMethod: "simulated_card", // In a real app, this would come from a payment form
      });
      toast.success(`Successfully upgraded to ${tier} plan!`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upgrade subscription"
      );
    } finally {
      setSelectedTier(null);
    }
  };

  if (isLoading || (!isAuthenticated && authState.type === "loading")) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton className={styles.titleSkeleton} />
          <Skeleton className={styles.subtitleSkeleton} />
        </div>
        {isAuthenticated && (
          <div className={styles.usageCard}>
            <Skeleton className={styles.usageSkeleton} />
          </div>
        )}
        <div className={styles.grid}>
          <Skeleton className={styles.cardSkeleton} />
          <Skeleton className={styles.cardSkeleton} />
          <Skeleton className={styles.cardSkeleton} />
        </div>
      </div>
    );
  }

  const currentTier = isAuthenticated ? (status?.tier || "free") : null;
  const propertiesUsed = isAuthenticated ? (status?.propertiesCount || 0) : 0;
  const propertyLimit = isAuthenticated ? (status?.propertyLimit || 1) : 1;
  const isUnlimited = propertyLimit === -1;
  
  // AI Report usage data
  const aiReportsUsed = isAuthenticated ? (status?.aiReportsUsed || 0) : 0;
  const aiReportLimit = isAuthenticated ? (status?.aiReportLimit || 10) : 10;
  const aiReportsRemaining = isAuthenticated ? (status?.aiReportsRemaining || 0) : 0;
  const aiReportResetDate = status?.aiReportResetDate;
  const aiReportLimitReached = aiReportsRemaining <= 0;
  
  // Calculate usage percentages
  const propertyUsagePercentage = isUnlimited 
    ? 100 // Just show full bar for unlimited but styled differently
    : Math.min(100, (propertiesUsed / propertyLimit) * 100);

  const aiReportUsagePercentage = Math.min(100, (aiReportsUsed / aiReportLimit) * 100);

  const propertyUsageText = isUnlimited
    ? t.propertiesUsedUnlimited.replace("{used}", propertiesUsed.toString())
    : t.propertiesUsed
        .replace("{used}", propertiesUsed.toString())
        .replace("{limit}", propertyLimit.toString());

  const aiReportUsageText = t.aiReports.aiReportsUsed
    .replace("{used}", aiReportsUsed.toString())
    .replace("{limit}", aiReportLimit.toString());

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>
          {t.subtitle}
        </p>
      </div>

      {/* Current Usage Stats - Only show for authenticated users */}
      {isAuthenticated && (
      <div className={styles.usageCard}>
        <div className={styles.usageHeader}>
          <div className={styles.usageTitleRow}>
            <h2 className={styles.usageTitle}>{t.currentPlan}</h2>
            <Badge variant={currentTier === "premium" ? "default" : "secondary"}>
              {currentTier ? t.tiers[currentTier].name : t.tiers.free.name}
            </Badge>
          </div>
        </div>

        {/* Property Usage */}
        <div className={styles.usageSection}>
          <div className={styles.usageStats}>
            <Building2 size={20} className={styles.usageIcon} />
            <span>{propertyUsageText}</span>
          </div>
          <div className={styles.progressContainer}>
            <Progress.Root className={styles.progressRoot} value={propertyUsagePercentage}>
              <Progress.Indicator
                className={styles.progressIndicator}
                style={{ transform: `translateX(-${100 - propertyUsagePercentage}%)` }}
              />
            </Progress.Root>
          </div>
        </div>

        {/* AI Report Usage */}
        <div className={styles.usageSection}>
          <div className={styles.usageStats}>
            <Brain size={20} className={styles.usageIcon} />
            <span>{aiReportUsageText}</span>
          </div>
          <div className={styles.progressContainer}>
            <Progress.Root 
              className={`${styles.progressRoot} ${aiReportLimitReached ? styles.progressLimitReached : ""}`} 
              value={aiReportUsagePercentage}
            >
              <Progress.Indicator
                className={`${styles.progressIndicator} ${aiReportLimitReached ? styles.progressIndicatorWarning : ""}`}
                style={{ transform: `translateX(-${100 - aiReportUsagePercentage}%)` }}
              />
            </Progress.Root>
          </div>
          <div className={styles.aiReportFooter}>
            {aiReportResetDate && (
              <p className={styles.resetText}>
                {t.aiReports.reportsReset} {new Date(aiReportResetDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            )}
            {aiReportLimitReached && (
              <Button 
                size="sm" 
                variant="outline" 
                className={styles.buyReportsButton}
                onClick={() => setBuyReportsOpen(true)}
              >
                <ShoppingCart size={16} />
                {t.aiReports.buyMoreReports}
              </Button>
            )}
          </div>
        </div>
        
        {status?.expiresAt && (
          <p className={styles.expiryText}>
            {t.renewsOn} {new Date(status.expiresAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        )}
      </div>
      )}

      {/* Pricing Grid */}
      <div className={styles.grid}>
        {TIERS.map((tier) => {
          const isCurrent = currentTier === tier.id;
          const isProcessing = isUpgrading && selectedTier === tier.id;
          const isDowngrade = isAuthenticated &&
            ((currentTier === "premium" && tier.id !== "premium") ||
            (currentTier === "basic" && tier.id === "free"));

          return (
            <div 
              key={tier.id} 
              className={`${styles.card} ${tier.isPopular ? styles.popularCard : ""} ${isCurrent ? styles.currentCard : ""}`}
            >
              {tier.isPopular && (
                <div className={styles.popularBadge}>
                  <Star size={12} fill="currentColor" /> {t.mostPopular}
                </div>
              )}

              <div className={styles.cardHeader}>
                <h3 className={styles.tierName}>{tier.name}</h3>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>{tier.price}</span>
                  <span className={styles.period}>{tier.period}</span>
                </div>
                <p className={styles.description}>{tier.description}</p>
              </div>

              <div className={styles.featuresList}>
                {tier.features.map((feature, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.featureItem} ${!feature.included ? styles.featureDisabled : ""}`}
                  >
                    {feature.included ? (
                      <Check size={18} className={styles.checkIcon} />
                    ) : (
                      <X size={18} className={styles.xIcon} />
                    )}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className={styles.cardFooter}>
                {isAuthenticated && isCurrent ? (
                  <Button 
                    className={styles.actionButton} 
                    variant="outline" 
                    disabled
                  >
                    {t.buttons.currentPlan}
                  </Button>
                ) : (
                  <Button
                    className={styles.actionButton}
                    variant={tier.isPopular ? "primary" : "secondary"}
                    disabled={isUpgrading || isDowngrade}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {isProcessing ? t.buttons.processing 
                      : isDowngrade ? t.buttons.downgrade 
                      : !isAuthenticated ? t.buttons.loginToUpgrade 
                      : t.buttons.upgrade}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison Table */}
      <FeaturesComparisonTable />

      <div className={styles.guaranteeSection}>
        <div className={styles.guaranteeItem}>
          <Shield className={styles.guaranteeIcon} />
          <div>
            <h4>{t.securePayment}</h4>
            <p>{t.securePaymentDesc}</p>
          </div>
        </div>
        <div className={styles.guaranteeItem}>
          <Zap className={styles.guaranteeIcon} />
          <div>
            <h4>{t.instantActivation}</h4>
            <p>{t.instantActivationDesc}</p>
          </div>
        </div>
      </div>

      {/* Buy Reports Dialog */}
      <BuyReportsDialog open={buyReportsOpen} onOpenChange={setBuyReportsOpen} />
    </div>
  );
}