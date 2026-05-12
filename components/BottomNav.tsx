import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Map as MapIcon, Plus, Coins } from "lucide-react";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./BottomNav.module.css";

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const currentPath = location.pathname;

  const isPropertiesActive = currentPath === "/properties" || currentPath.startsWith("/properties/");
  const isMapActive = currentPath === "/map";
  const isAddPropertyActive = currentPath === "/add-property";
  const isInvestActive = currentPath === "/invest" || currentPath.startsWith("/invest/");

  return (
    <nav className={styles.nav} role="navigation" aria-label={language === "ar" ? "القائمة السفلية" : "Bottom navigation"}>
      <div className={styles.container}>
        <Link
          to="/properties"
          className={`${styles.link} ${isPropertiesActive ? styles.active : ""}`}
          aria-current={isPropertiesActive ? "page" : undefined}
          aria-label={language === "ar" ? "الرئيسية" : "Home"}
        >
          <Home size={24} aria-hidden="true" />
          <span className={styles.label}>
            <span className={styles.labelEn} aria-hidden="true">Home</span>
            <span className={styles.labelAr} aria-hidden="true">الرئيسية</span>
          </span>
        </Link>
        <Link
          to="/invest"
          className={`${styles.link} ${isInvestActive ? styles.active : ""}`}
          aria-current={isInvestActive ? "page" : undefined}
          aria-label={language === "ar" ? "استثمار" : "Invest"}
        >
          <Coins size={24} aria-hidden="true" />
          <span className={styles.label}>
            <span className={styles.labelEn} aria-hidden="true">Invest</span>
            <span className={styles.labelAr} aria-hidden="true">استثمار</span>
          </span>
        </Link>
        <Link
          to="/add-property"
          className={`${styles.link} ${styles.addPropertyLink} ${isAddPropertyActive ? styles.active : ""}`}
          aria-current={isAddPropertyActive ? "page" : undefined}
          aria-label={language === "ar" ? "إضافة عقار" : "Add Property"}
        >
          <Plus size={28} aria-hidden="true" />
          <span className={styles.label}>
            <span className={styles.labelEn} aria-hidden="true">Add</span>
            <span className={styles.labelAr} aria-hidden="true">إضافة</span>
          </span>
        </Link>
        <Link
          to="/map"
          className={`${styles.link} ${isMapActive ? styles.active : ""}`}
          aria-current={isMapActive ? "page" : undefined}
          aria-label={language === "ar" ? "الخريطة" : "Map"}
        >
          <MapIcon size={24} aria-hidden="true" />
          <span className={styles.label}>
            <span className={styles.labelEn} aria-hidden="true">Map</span>
            <span className={styles.labelAr} aria-hidden="true">الخريطة</span>
          </span>
        </Link>
      </div>
    </nav>
  );
};