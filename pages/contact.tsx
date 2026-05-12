import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { LandingNavigation } from "../components/LandingNavigation";
import { Button } from "../components/Button";
import { ArrowRight, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./contact.module.css";

export default function ContactPage() {
  const { language, direction } = useLanguage();

  const t = {
    ar: {
      title: "اتصل بنا - SKNAI",
      metaDescription: "تواصل مع فريق SKNAI - منصة العقارات الذكية في السعودية",
      heroTitle: "اتصل بنا",
      heroSubtitle: "نحن هنا للإجابة على أسئلتك",
      emailTitle: "البريد الإلكتروني",
      emailDesc: "تواصل معنا عبر البريد الإلكتروني للاستفسارات والدعم الفني",
      phoneTitle: "رقم الهاتف",
      phoneDesc: "اتصل بنا مباشرة لأي استفسارات عاجلة",
      locationTitle: "الموقع",
      locationDesc: "زر مكتبنا في الرياض خلال ساعات العمل",
      locationValue: "الرياض، المملكة العربية السعودية",
      comingSoon: "قريباً",
      comingSoonSubtext: "سيتم إطلاق نموذج الاتصال والدردشة المباشرة قريباً",
      backToHome: "العودة للرئيسية"
    },
    en: {
      title: "Contact Us - SKNAI",
      metaDescription: "Contact SKNAI team - The smart real estate platform in Saudi Arabia",
      heroTitle: "Contact Us",
      heroSubtitle: "We are here to answer your questions",
      emailTitle: "Email",
      emailDesc: "Contact us via email for inquiries and technical support",
      phoneTitle: "Phone Number",
      phoneDesc: "Call us directly for urgent inquiries",
      locationTitle: "Location",
      locationDesc: "Visit our office in Riyadh during working hours",
      locationValue: "Riyadh, Saudi Arabia",
      comingSoon: "Coming Soon",
      comingSoonSubtext: "Contact form and live chat will be launched soon",
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
            <p className={styles.subtitle}>{content.heroSubtitle}</p>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.contentWrapper}>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                  <Mail size={24} />
                </div>
                <h3 className={styles.cardTitle}>{content.emailTitle}</h3>
                <p className={styles.cardDescription}>
                  {content.emailDesc}
                </p>
                <p className={styles.cardValue}>support@sknai</p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                  <Phone size={24} />
                </div>
                <h3 className={styles.cardTitle}>{content.phoneTitle}</h3>
                <p className={styles.cardDescription}>
                  {content.phoneDesc}
                </p>
                <p className={styles.cardValue} dir="ltr">+966 50 000 0000</p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>
                  <MapPin size={24} />
                </div>
                <h3 className={styles.cardTitle}>{content.locationTitle}</h3>
                <p className={styles.cardDescription}>
                  {content.locationDesc}
                </p>
                <p className={styles.cardValue}>{content.locationValue}</p>
              </div>
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