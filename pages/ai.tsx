import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { LandingNavigation } from "../components/LandingNavigation";
import { Button } from "../components/Button";
import { ArrowRight, ArrowLeft, Brain, TrendingUp, MapPin, AlertCircle } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./ai.module.css";

export default function AIPage() {
  const { language, direction } = useLanguage();

  const t = {
    ar: {
      title: "الذكاء الاصطناعي - SKNAI",
      metaDescription: "استكشف قدرات الذكاء الاصطناعي في منصة SKNAI لتحليل العقارات",
      heroTitle: "الذكاء الاصطناعي",
      heroSubtitle: "تحليل ذكي ورؤى مدعومة بالتكنولوجيا",
      features: {
        smartAnalysis: {
          title: "تحليل ذكي",
          desc: "استخدم الذكاء الاصطناعي للحصول على تحليل عميق وشامل لكل عقار"
        },
        pricePrediction: {
          title: "توقعات الأسعار",
          desc: "احصل على توقعات دقيقة لأسعار العقارات بناءً على بيانات السوق"
        },
        locationAnalysis: {
          title: "تحليل الموقع",
          desc: "اكتشف جميع الخدمات القريبة والمرافق المتاحة حول العقار"
        },
        safetyRating: {
          title: "تقييم الأمان",
          desc: "تقييم شامل لمستويات الأمان والسلامة في المنطقة"
        }
      },
      howItWorks: {
        title: "كيف يعمل نظامنا؟",
        text: "تستخدم منصة SKNAI تقنيات الذكاء الاصطناعي المتقدمة لإنشاء تقرير مخصص لكل عقار بناءً على إحداثياته الجغرافية الدقيقة (خط الطول والعرض). يقوم نظامنا بتحليل تلقائي لموقع العقار على الخريطة لتوليد رؤى مفصلة تشمل: المدارس والحدائق والمستشفيات والمراكز التجارية القريبة بناءً على الموقع الجغرافي الفعلي، وتقييمات الأمان والسلامة الخاصة بالمنطقة، وتوقعات أسعار السوق المتوقعة على أساس البيانات الموقعية. كل عقار يحصل على تقرير فريد يعكس مميزات وخصائص موقعه المحدد على الخريطة."
      },
      comingSoon: "قريباً",
      comingSoonSubtext: "سيتم إطلاق تقارير الذكاء الاصطناعي المتقدمة قريباً",
      backToHome: "العودة للرئيسية"
    },
    en: {
      title: "AI Features - SKNAI",
      metaDescription: "Explore AI capabilities in SKNAI platform for real estate analysis",
      heroTitle: "Artificial Intelligence",
      heroSubtitle: "Smart analysis and technology-driven insights",
      features: {
        smartAnalysis: {
          title: "Smart Analysis",
          desc: "Use AI to get deep and comprehensive analysis for each property"
        },
        pricePrediction: {
          title: "Price Predictions",
          desc: "Get accurate property price predictions based on market data"
        },
        locationAnalysis: {
          title: "Location Analysis",
          desc: "Discover all nearby services and amenities available around the property"
        },
        safetyRating: {
          title: "Safety Rating",
          desc: "Comprehensive assessment of safety and security levels in the area"
        }
      },
      howItWorks: {
        title: "How does our system work?",
        text: "SKNAI uses advanced AI technologies to generate a custom report for each property based on its precise geographic coordinates (latitude and longitude). Our system automatically analyzes the property location on the map to generate detailed insights including: nearby schools, parks, hospitals, and commercial centers based on actual geographic location, safety and security ratings for the area, and expected market price predictions based on location data. Each property gets a unique report reflecting the features and characteristics of its specific location on the map."
      },
      comingSoon: "Coming Soon",
      comingSoonSubtext: "Advanced AI reports will be launched soon",
      backToHome: "Back to Home"
    }
  };

  const content = t[language];
  const ArrowIcon = direction === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <>
      <Helmet>
        <title>{content.title}</title>
        <meta
          name="description"
          content={content.metaDescription}
        />
      </Helmet>

      <LandingNavigation />

      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{content.heroTitle}</h1>
            <p className={styles.subtitle}>
              {content.heroSubtitle}
            </p>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.contentWrapper}>
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <Brain size={28} />
                </div>
                <h3 className={styles.featureTitle}>{content.features.smartAnalysis.title}</h3>
                <p className={styles.featureDescription}>
                  {content.features.smartAnalysis.desc}
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <TrendingUp size={28} />
                </div>
                <h3 className={styles.featureTitle}>{content.features.pricePrediction.title}</h3>
                <p className={styles.featureDescription}>
                  {content.features.pricePrediction.desc}
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <MapPin size={28} />
                </div>
                <h3 className={styles.featureTitle}>{content.features.locationAnalysis.title}</h3>
                <p className={styles.featureDescription}>
                  {content.features.locationAnalysis.desc}
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.iconWrapper}>
                  <AlertCircle size={28} />
                </div>
                <h3 className={styles.featureTitle}>{content.features.safetyRating.title}</h3>
                <p className={styles.featureDescription}>
                  {content.features.safetyRating.desc}
                </p>
              </div>
            </div>

            <div className={styles.description}>
              <h2 className={styles.descriptionTitle}>{content.howItWorks.title}</h2>
              <p className={styles.descriptionText}>
                {content.howItWorks.text}
              </p>
            </div>

            <div className={styles.comingSoon}>
              <p className={styles.comingSoonText}>{content.comingSoon}</p>
              {language === 'ar' && <p className={styles.comingSoonTextEn}>Coming Soon</p>}
              <p className={styles.comingSoonSubtext}>
                {content.comingSoonSubtext}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <Button asChild variant="primary" size="lg">
            <Link to="/">
              {content.backToHome}
              <ArrowIcon size={18} />
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}