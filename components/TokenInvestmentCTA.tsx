import React from "react";
import { Link } from "react-router-dom";
import { Coins, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "./Button";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./TokenInvestmentCTA.module.css";

export const TokenInvestmentCTA = () => {
  const { language } = useLanguage();

  const t = {
    ar: {
      title: "استثمر في العقارات بالتوكن",
      subtitle: "امتلك حصة في أفضل العقارات السعودية بأقل مبلغ",
      cta: "ابدأ الاستثمار",
      features: [
        {
          title: "تملك جزئي",
          description: "استثمر بمبالغ صغيرة في عقارات تبدأ من 100,000 ريال",
          Icon: Coins,
        },
        {
          title: "منظم وآمن",
          description: "متوافق مع هيئة العقار السعودية",
          Icon: ShieldCheck,
        },
        {
          title: "دخل شهري",
          description: "احصل على عوائد إيجارية مباشرة في محفظتك",
          Icon: TrendingUp,
        },
      ],
    },
    en: {
      title: "Invest in Tokenized Real Estate",
      subtitle: "Own a share in premium Saudi properties starting from as low as SAR 100",
      cta: "Start Investing",
      features: [
        {
          title: "Fractional Ownership",
          description: "Invest small amounts in properties starting from SAR 100",
          Icon: Coins,
        },
        {
          title: "Regulated & Secure",
          description: "Compliant with Saudi CMA regulations",
          Icon: ShieldCheck,
        },
        {
          title: "Monthly Income",
          description: "Receive rental income directly to your wallet",
          Icon: TrendingUp,
        },
      ],
    },
  };

  const content = t[language];

  return (
    <section className={styles.tokenSection}>
      <div className={styles.tokenContent}>
        <div className={styles.header}>
          <h2 className={styles.tokenTitle}>{content.title}</h2>
          <p className={styles.tokenSubtitle}>{content.subtitle}</p>
        </div>

        <div className={styles.tokenFeatures}>
          {content.features.map((feature, index) => (
            <div key={index} className={styles.tokenFeatureCard}>
              <div className={styles.iconWrapper}>
                <feature.Icon className={styles.icon} />
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.tokenCta}>
          <Button asChild size="lg" className={styles.ctaButton}>
            <Link to="/invest">{content.cta}</Link>
          </Button>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className={styles.bgGlow} />
    </section>
  );
};