import React from "react";
import { Search, Home, FileCheck } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./HowItWorks.module.css";

export const HowItWorks = () => {
  const { language } = useLanguage();

  const t = {
    ar: {
      title: "كيف يعمل؟",
      subtitle: "خطوات بسيطة تفصلك عن منزل أحلامك",
      steps: [
        {
          title: "ابحث عن عقارك",
          description: "استخدم محرك البحث الذكي لتصفح آلاف العقارات المتاحة للبيع أو الإيجار في منطقتك المفضلة.",
        },
        {
          title: "قم بزيارة العقار",
          description: "تواصل مع المعلن مباشرة أو احجز موعداً لزيارة العقار والتأكد من مطابقته للمواصفات.",
        },
        {
          title: "أتمم الإجراءات",
          description: "نقدم لك الدعم والمشورة القانونية لإتمام إجراءات البيع أو الإيجار بكل سهولة وأمان.",
        }
      ]
    },
    en: {
      title: "How It Works?",
      subtitle: "Simple steps separating you from your dream home",
      steps: [
        {
          title: "Search Property",
          description: "Use our smart search engine to browse thousands of properties available for sale or rent in your preferred area.",
        },
        {
          title: "Visit Property",
          description: "Contact the advertiser directly or book an appointment to visit the property and ensure it meets your specifications.",
        },
        {
          title: "Complete Process",
          description: "We provide legal support and advice to complete sale or rental procedures with ease and security.",
        }
      ]
    }
  };

  const content = t[language];

  const stepsWithIcons = [
    { icon: Search, color: "var(--primary)", ...content.steps[0] },
    { icon: Home, color: "var(--accent)", ...content.steps[1] },
        { icon: FileCheck, color: "var(--primary)", ...content.steps[2] },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{content.title}</h2>
          <p className={styles.subtitle}>{content.subtitle}</p>
        </div>

        <div className={styles.steps}>
          {stepsWithIcons.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.iconWrapper} style={{ color: step.color }}>
                <step.icon size={32} />
                <span className={styles.stepNumber}>{index + 1}</span>
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};