import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../helpers/useLanguage";
import { 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Heart
} from "lucide-react";
import { Logo } from "./Logo";
import styles from "./AppFooter.module.css";

interface AppFooterProps {
  className?: string;
  showBottomPadding?: boolean;
}

export const AppFooter = ({ className = "", showBottomPadding = true }: AppFooterProps) => {
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();
  const isArabic = language === "ar";

  const content = {
    ar: {
      brandDescription: "منصة عقارية ذكية مدعومة بالذكاء الاصطناعي لمساعدتك في العثور على منزل أحلامك في المملكة العربية السعودية بسهولة وأمان.",
      contactEmail: "contact@sknai.xyz",
      contactLocation: "الرياض، المملكة العربية السعودية",
      
      headers: {
        quickLinks: "روابط سريعة",
        legal: "معلومات قانونية",
        social: "تواصل معنا",
      },

      links: {
        about: "عن المنصة",
        map: "خريطة العقارات",
        properties: "تصفح العقارات",
        contact: "اتصل بنا",
        privacy: "سياسة الخصوصية",
        terms: "شروط الخدمة",
        cookies: "ملفات تعريف الارتباط",
        dataProtection: "حماية البيانات",
        disclaimer: "إخلاء المسؤولية",
        sitemap: "خريطة الموقع"
      },

      newsletter: "اشترك في نشرتنا الإخبارية للحصول على آخر التحديثات والعروض العقارية (قريباً)",
      copyright: `© ${currentYear} سكني. جميع الحقوق محفوظة.`,
      madeIn: "صنع بكل فخر في السعودية",
      footerLinks: ["سياسة الخصوصية", "الشروط"]
    },
    en: {
      brandDescription: "Smart AI-powered real estate platform helping you find your dream home in Saudi Arabia with ease and security.",
      contactEmail: "contact@sknai.xyz",
      contactLocation: "Riyadh, Saudi Arabia",

      headers: {
        quickLinks: "Quick Links",
        legal: "Legal",
        social: "Follow Us",
      },

      links: {
        about: "About Us",
        map: "Property Map",
        properties: "Browse Properties",
        contact: "Contact Us",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        cookies: "Cookie Policy",
        dataProtection: "Data Protection",
        disclaimer: "Disclaimer",
        sitemap: "Sitemap"
      },
      
      newsletter: "Subscribe to our newsletter for the latest updates and property deals (Coming Soon)",
      copyright: `© ${currentYear} SKNAI. All rights reserved.`,
      madeIn: "Proudly Made in Saudi Arabia",
      footerLinks: ["Privacy", "Terms"]
    }
  };

  const t = content[language];

  return (
    <footer className={`${styles.footer} ${showBottomPadding ? styles.withBottomPadding : ""} ${className}`}>
      {/* Gradient Top Line */}
      <div className={styles.gradientLine} />

      <div className={styles.container}>
        <div className={styles.mainGrid}>
          {/* Column 1: Brand */}
          <div className={styles.column}>
            <div className={styles.brandWrapper}>
              <Logo size="md" variant="full" />
              <p className={styles.brandDescription}>{t.brandDescription}</p>
              
              <div className={styles.contactInfo}>
                <a href={`mailto:${t.contactEmail}`} className={styles.contactItem}>
                  <Mail size={16} className={styles.contactIcon} />
                  <span>{t.contactEmail}</span>
                </a>
                <div className={styles.contactItem}>
                  <MapPin size={16} className={styles.contactIcon} />
                  <span>{t.contactLocation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className={styles.column}>
            <h3 className={styles.columnHeader}>{t.headers.quickLinks}</h3>
            <ul className={styles.linkList}>
              <li><Link to="/about" className={styles.link}>{t.links.about}</Link></li>
              <li><Link to="/map" className={styles.link}>{t.links.map}</Link></li>
              <li><Link to="/properties" className={styles.link}>{t.links.properties}</Link></li>
              <li><Link to="/contact" className={styles.link}>{t.links.contact}</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className={styles.column}>
            <h3 className={styles.columnHeader}>{t.headers.legal}</h3>
            <ul className={styles.linkList}>
              <li><Link to="/privacy" className={styles.link}>{t.links.privacy}</Link></li>
              <li><Link to="/terms" className={styles.link}>{t.links.terms}</Link></li>
              <li><Link to="/privacy#cookies" className={styles.link}>{t.links.cookies}</Link></li>
              <li><Link to="/privacy#data-protection" className={styles.link}>{t.links.dataProtection}</Link></li>
              <li><Link to="/terms#disclaimer" className={styles.link}>{t.links.disclaimer}</Link></li>
            </ul>
          </div>

          {/* Column 4: Social & Newsletter */}
          <div className={styles.column}>
            <h3 className={styles.columnHeader}>{t.headers.social}</h3>
            <div className={styles.socialIcons}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
            
            <div className={styles.newsletter}>
              <p className={styles.newsletterText}>{t.newsletter}</p>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            {t.copyright}
          </div>

          <div className={styles.madeInBadge}>
            <span>{t.madeIn}</span>
            <Heart size={14} className={styles.heartIcon} fill="currentColor" />
          </div>

          <div className={styles.bottomLinks}>
            <Link to="/privacy" className={styles.bottomLink}>{t.footerLinks[0]}</Link>
            <span className={styles.bottomSeparator}>|</span>
            <Link to="/terms" className={styles.bottomLink}>{t.footerLinks[1]}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};