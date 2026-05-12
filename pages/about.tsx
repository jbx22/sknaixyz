import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { LandingNavigation } from "../components/LandingNavigation";
import { Button } from "../components/Button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./about.module.css";

export default function AboutPage() {
  const { language, direction } = useLanguage();

  const t = {
    ar: {
      title: "عن المنصة - SKNAI",
      metaDescription: "تعرف على منصة SKNAI - أحدث منصة عقارات ذكية في السعودية",
      heroTitle: "عن المنصة",
      heroSubtitle: "SKNAI - منصة العقارات الذكية الحديثة",
      whoWeAreTitle: "من نحن؟",
      whoWeAreText: "منصة SKNAI هي أحدث منصة عقارات مدعومة بالذكاء الاصطناعي في السعودية. نهدف إلى توفير تجربة بحث عقارية سهلة وحديثة وموثوقة لجميع المستخدمين.",
      servicesTitle: "خدماتنا",
      servicesText: "نوفر خدمات متقدمة تشمل البحث الذكي عن العقارات، التقارير المدعومة بالذكاء الاصطناعي، والخرائط التفاعلية، وميزات التواصل المباشر بين المستخدمين.",
      missionTitle: "رسالتنا",
      missionText: "نسعى لتسهيل عملية البحث والاستثمار العقاري من خلال تقنيات حديثة وتطبيقات ذكية، مما يوفر أفضل تجربة للمستثمرين والباحثين عن العقارات في المملكة.",
      comingSoon: "قريباً",
      backToHome: "العودة للرئيسية"
    },
    en: {
      title: "About Us - SKNAI",
      metaDescription: "Learn about SKNAI - The latest smart real estate platform in Saudi Arabia",
      heroTitle: "About Us",
      heroSubtitle: "SKNAI - The Modern Smart Real Estate Platform",
      whoWeAreTitle: "Who We Are?",
      whoWeAreText: "SKNAI is the latest AI-powered real estate platform in Saudi Arabia. We aim to provide an easy, modern, and reliable property search experience for all users.",
      servicesTitle: "Our Services",
      servicesText: "We provide advanced services including smart property search, AI-powered reports, interactive maps, and direct communication features between users.",
      missionTitle: "Our Mission",
      missionText: "We strive to facilitate the property search and investment process through modern technologies and smart applications, providing the best experience for investors and property seekers in the Kingdom.",
      comingSoon: "Coming Soon",
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
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{content.whoWeAreTitle}</h2>
              <p className={styles.paragraph}>
                {content.whoWeAreText}
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{content.servicesTitle}</h2>
              <p className={styles.paragraph}>
                {content.servicesText}
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{content.missionTitle}</h2>
              <p className={styles.paragraph}>
                {content.missionText}
              </p>
            </div>

            <div className={styles.comingSoon}>
              <p className={styles.comingSoonText}>{content.comingSoon}</p>
              {language === 'ar' && <p className={styles.comingSoonTextEn}>Coming Soon</p>}
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