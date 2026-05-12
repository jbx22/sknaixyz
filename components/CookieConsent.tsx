import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "./Button";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./CookieConsent.module.css";

const STORAGE_KEY = "sknai_cookie_consent";

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Small delay to not jar the user immediately on load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, analytics: true, marketing: true }));
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, analytics: false, marketing: false }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const t = {
    title: language === "ar" ? "نحن نستخدم ملفات تعريف الارتباط" : "We use cookies",
    description: language === "ar" 
      ? "نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور. بعضها ضروري لعمل الموقع."
      : "We use cookies to enhance your experience and analyze traffic. Some are essential for the site to function.",
    accept: language === "ar" ? "قبول الكل" : "Accept All",
    reject: language === "ar" ? "رفض غير الضرورية" : "Reject Non-Essential",
    privacyLink: language === "ar" ? "سياسة الخصوصية" : "Privacy Policy",
    readMore: language === "ar" ? "اقرأ المزيد في" : "Read more in our"
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Cookie size={24} className={styles.icon} />
        </div>
        <div className={styles.textWrapper}>
          <h3 className={styles.title}>{t.title}</h3>
          <p className={styles.description}>
            {t.description}{" "}
            {t.readMore}{" "}
            <Link to="/privacy" className={styles.link}>
              {t.privacyLink}
            </Link>.
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRejectNonEssential}
          className={styles.rejectButton}
        >
          {t.reject}
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleAcceptAll}
          className={styles.acceptButton}
        >
          {t.accept}
        </Button>
      </div>
      <button 
        className={styles.closeButton} 
        onClick={handleRejectNonEssential}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};