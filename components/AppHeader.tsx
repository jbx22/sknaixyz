import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeModeSwitch } from "./ThemeModeSwitch";
import { Button } from "./Button";
import { useLanguage } from "../helpers/useLanguage";
import { useAuth } from "../helpers/useAuth";
import { useMediaQuery } from "../helpers/useMediaQuery";
import { Globe, Map as MapIcon, Search, Bot, User as UserIcon, LogIn, LogOut, Shield, Coins, LayoutDashboard, Percent, ClipboardCheck, ChevronDown, PlusCircle, FileText } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import styles from "./AppHeader.module.css";

export interface AppHeaderProps {
  /**
   * Whether to show the navigation links (desktop only)
   * @default false
   */
  showNavLinks?: boolean;
  /**
   * Optional CSS class
   */
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showNavLinks = false,
  className,
}) => {
  const { language, setLanguage } = useLanguage();
  const { authState, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for very small screens (< 380px)
  const isSmallScreen = useMediaQuery("(max-width: 380px)");

  const isActive = (path: string) => location.pathname === path;

  const isAdmin = authState.type === "authenticated" && (authState.user.role === "admin" || authState.user.role === "superadmin");
  const isSuperadmin = authState.type === "authenticated" && authState.user.role === "superadmin";
  const adminLink = isSuperadmin ? "/superadmin" : "/admin/dashboard";

  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const subscriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subscriptionRef.current && !subscriptionRef.current.contains(e.target as Node)) {
        setSubscriptionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className={`${styles.header} ${className || ""}`} role="banner">
      <div className={styles.container}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <Logo 
            size="md" 
            variant={isSmallScreen ? "compact" : "full"} 
          />
        </div>

        {/* Navigation Section - Visible on Desktop if enabled */}
        {showNavLinks && (
          <nav className={styles.navSection} role="navigation" aria-label={language === "ar" ? "القائمة الرئيسية" : "Main Navigation"}>
            <Link
              to="/properties"
              className={`${styles.navLink} ${isActive("/properties") ? styles.active : ""}`}
              aria-current={isActive("/properties") ? "page" : undefined}
            >
              <Search size={16} aria-hidden="true" />
              <span>{language === "ar" ? "البحث" : "Search"}</span>
            </Link>
            <Link
              to="/map"
              className={`${styles.navLink} ${isActive("/map") ? styles.active : ""}`}
              aria-current={isActive("/map") ? "page" : undefined}
            >
              <MapIcon size={16} aria-hidden="true" />
              <span>{language === "ar" ? "الخريطة" : "Map"}</span>
            </Link>
            <Link
              to="/invest"
              className={`${styles.navLink} ${isActive("/invest") || location.pathname.startsWith("/invest") ? styles.active : ""}`}
              aria-current={isActive("/invest") ? "page" : undefined}
            >
              <Coins size={16} aria-hidden="true" />
              <span>{language === "ar" ? "استثمار" : "Invest"}</span>
            </Link>
            <Link
              to="/ai"
              className={`${styles.navLink} ${isActive("/ai") ? styles.active : ""}`}
              aria-current={isActive("/ai") ? "page" : undefined}
            >
              <Bot size={16} aria-hidden="true" />
              <span>{language === "ar" ? "الذكاء الاصطناعي" : "AI Tools"}</span>
            </Link>
            <div className={styles.subscriptionDropdown} ref={subscriptionRef}>
              <button
                className={`${styles.navLink} ${styles.dropdownToggle} ${location.pathname.startsWith("/subscription") ? styles.active : ""}`}
                onClick={() => setSubscriptionOpen(!subscriptionOpen)}
                aria-expanded={subscriptionOpen}
                onMouseEnter={() => setSubscriptionOpen(true)}
              >
                <ClipboardCheck size={16} aria-hidden="true" />
                <span>{language === "ar" ? "الاشتراكات" : "Subscriptions"}</span>
                <ChevronDown size={12} className={`${styles.dropdownChevron} ${subscriptionOpen ? styles.dropdownChevronOpen : ""}`} />
              </button>
              {subscriptionOpen && (
                <div className={styles.dropdownMenu} onMouseLeave={() => setSubscriptionOpen(false)}>
                  <Link
                    to="/subscription/apply"
                    className={`${styles.dropdownItem} ${isActive("/subscription/apply") ? styles.active : ""}`}
                    onClick={() => setSubscriptionOpen(false)}
                  >
                    <PlusCircle size={16} />
                    <span>{language === "ar" ? "إضافة اشتراك" : "Add Subscription"}</span>
                  </Link>
                  <Link
                    to="/subscription/status"
                    className={`${styles.dropdownItem} ${isActive("/subscription/status") ? styles.active : ""}`}
                    onClick={() => setSubscriptionOpen(false)}
                  >
                    <FileText size={16} />
                    <span>{language === "ar" ? "حالة الاشتراك" : "Subscription Status"}</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}

        {/* Actions Section */}
        <div className={styles.actionsSection} role="toolbar" aria-label={language === "ar" ? "أدوات المستخدم" : "User tools"}>
          <button
            className={styles.iconButton}
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            aria-label={language === "ar" ? "Switch to English" : "التبديل للعربية"}
            title={language === "ar" ? "Switch to English" : "التبديل للعربية"}
          >
            <Globe size={18} aria-hidden="true" />
            <span className={`${styles.langText} ${isSmallScreen ? styles.hiddenOnMobile : ""}`} aria-hidden="true">
              {language === "ar" ? "EN" : "AR"}
            </span>
          </button>

          <div className={`${styles.divider} ${isSmallScreen ? styles.hiddenOnMobile : ""}`} aria-hidden="true" />

          <ThemeModeSwitch className={isSmallScreen ? styles.compactThemeSwitch : ""} />

          {authState.type === "authenticated" && <NotificationBell />}

          {authState.type === "authenticated" ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="icon-md" className={styles.adminButton} title={isSuperadmin ? (language === "ar" ? "المسؤول الأعلى" : "Super Admin") : ADMIN_STRINGS[language].dashboard}>
                  <Link to={adminLink} aria-label={isSuperadmin ? (language === "ar" ? "لوحة تحكم المسؤول الأعلى" : "Super Admin Dashboard") : (language === "ar" ? "لوحة تحكم المسؤول" : "Admin Dashboard")}>
                    <Shield size={18} aria-hidden="true" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="icon-md" className={styles.profileButton}>
                <Link to="/dashboard" aria-label={language === "ar" ? "لوحة التحكم" : "Dashboard"}>
                  <UserIcon size={18} aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-md"
                className={styles.logoutButton}
                onClick={handleLogout}
                aria-label={language === "ar" ? "تسجيل الخروج" : "Logout"}
                title={language === "ar" ? "خروج" : "Logout"}
              >
                <LogOut size={18} aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Button asChild variant="primary" size="sm" className={styles.loginButton}>
              <Link to="/login" aria-label={language === "ar" ? "تسجيل الدخول" : "Login"}>
                <LogIn size={16} className={styles.loginIcon} aria-hidden="true" />
                <span className={styles.loginText}>{language === "ar" ? "دخول" : "Login"}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
