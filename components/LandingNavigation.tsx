import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Logo } from "./Logo";
import { ThemeModeSwitch } from "./ThemeModeSwitch";
import { useLanguage } from "../helpers/useLanguage";
import { useAuth } from "../helpers/useAuth";
import { useMediaQuery } from "../helpers/useMediaQuery";
import { Globe, User, LogOut } from "lucide-react";
import styles from "./LandingNavigation.module.css";

export const LandingNavigation = () => {
  const { language, setLanguage } = useLanguage();
  const { authState, logout } = useAuth();
  const navigate = useNavigate();

  // On very small screens (< 380px), use compact variant to save space
  const isSmallScreen = useMediaQuery("(max-width: 380px)");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const t = {
    demoMode: language === "ar" ? "الوضع التجريبي" : "Demo Mode",
    login: language === "ar" ? "تسجيل الدخول" : "Login",
    dashboard: language === "ar" ? "لوحة التحكم" : "Dashboard",
    logout: language === "ar" ? "تسجيل الخروج" : "Logout",
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.startSection}>
          <div className={styles.logoWrapper}>
            <Logo
              size="md"
              variant={isSmallScreen ? "compact" : "full"}
              className={styles.logo}
            />
          </div>

          <div className={styles.separator} />

          <div className={styles.actionsWrapper}>
            {/* Language Switcher - Icon only on mobile, text on desktop */}
            <button
              className={styles.actionButton}
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              aria-label="Switch Language"
            >
              <Globe size={18} />
              <span className={styles.buttonText}>
                {language === "ar" ? "English" : "العربية"}
              </span>
            </button>

            <ThemeModeSwitch className={styles.themeSwitch} />
          </div>

          <div className={styles.authWrapper}>
            {authState.type === "authenticated" ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="md"
                  className={styles.dashboardLink}
                >
                  <Link to="/dashboard">
                    <User size={18} />
                    <span className={styles.buttonText}>{t.dashboard}</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-md"
                  onClick={handleLogout}
                  title={t.logout}
                  aria-label={t.logout}
                >
                  <LogOut size={18} />
                </Button>
              </>
            ) : (
              <Button asChild variant="primary" size="md">
                <Link to="/login">{t.login}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className={styles.endSection}>
          <Badge variant="secondary" className={styles.badge}>
            {t.demoMode}
          </Badge>
        </div>
      </div>
    </nav>
  );
};