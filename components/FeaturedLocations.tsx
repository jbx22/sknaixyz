import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./FeaturedLocations.module.css";

const LOCATIONS = [
  {
    nameAr: "الرياض",
    nameEn: "Riyadh",
    count: 1250,
    image: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=600",
    slug: "riyadh"
  },
  {
    nameAr: "جدة",
    nameEn: "Jeddah",
    count: 980,
        image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600",
    slug: "jeddah"
  },
  {
    nameAr: "الدمام",
    nameEn: "Dammam",
    count: 450,
    image: "https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600",
    slug: "dammam"
  },
  {
    nameAr: "مكة المكرمة",
    nameEn: "Makkah",
    count: 320,
    image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600",
    slug: "makkah"
  }
];

export const FeaturedLocations = () => {
  const { language } = useLanguage();

  const t = {
    ar: {
      title: "مواقع مميزة",
      subtitle: "اكتشف العقارات في أكثر المدن طلباً",
      propertyCount: "عقار"
    },
    en: {
      title: "Featured Locations",
      subtitle: "Discover properties in most demanded cities",
      propertyCount: "properties"
    }
  };

  const content = t[language];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{content.title}</h2>
          <p className={styles.subtitle}>{content.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {LOCATIONS.map((location) => {
            const name = language === 'ar' ? location.nameAr : location.nameEn;
            
            return (
              <Link 
                key={location.slug} 
                to={`/properties?search=${name}`}
                className={styles.card}
              >
                <div className={styles.imageWrapper}>
                  <img src={location.image} alt={name} className={styles.image} loading="lazy" />
                  <div className={styles.overlay} />
                </div>
                <div className={styles.content}>
                  <h3 className={styles.locationName}>{name}</h3>
                  <span className={styles.propertyCount}>{location.count} {content.propertyCount}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};