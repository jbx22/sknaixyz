import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../helpers/useLanguage";
import { useMediaQuery } from "../helpers/useMediaQuery";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  CreditCard, 
  Activity, 
  Menu, 
  X,
  Coins,
  ShieldCheck,
  CircleDollarSign,
  FileSearch,
  ShieldAlert,
  ClipboardCheck,
  Percent,
  ArrowLeftRight
} from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { Button } from "./Button";
import { Logo } from "./Logo";
import styles from "./AdminSidebar.module.css";

export const AdminSidebar = () => {
  const { language } = useLanguage();
  const { authState } = useAuth();
  const t = ADMIN_STRINGS[language];
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const isSuperadmin = authState.type === "authenticated" && authState.user.role === "superadmin";

  const links = [
    ...(isSuperadmin ? [{ path: "/superadmin", label: language === 'ar' ? 'المسؤول الأعلى' : 'Super Admin', icon: <ShieldAlert size={20} />, special: true }] : []),
    { path: "/admin/dashboard", label: t.dashboard, icon: <LayoutDashboard size={20} /> },
    { path: "/admin/users", label: t.users, icon: <Users size={20} /> },
    { path: "/admin/properties", label: t.properties, icon: <Building2 size={20} /> },
    { path: "/admin/subscriptions", label: t.subscriptions, icon: <CreditCard size={20} /> },
    { path: "/admin/subscription-approvals", label: language === 'ar' ? 'موافقات الاشتراك' : 'Subscription Approvals', icon: <ClipboardCheck size={20} /> },
    { path: "/admin/activity", label: t.activityLogs, icon: <Activity size={20} /> },
    { path: "/admin/fractional-ownership", label: language === 'ar' ? 'الملكية الجزئية' : 'Fractional Ownership', icon: <Percent size={20} /> },
    { path: "/admin/tokenization", label: language === 'ar' ? 'التمويل' : 'Tokenization', icon: <Coins size={20} /> },
    { path: "/admin/secondary-market", label: language === 'ar' ? 'السوق الثانوية' : 'Secondary Market', icon: <ArrowLeftRight size={20} /> },
    { path: "/admin/tokenization-kyc", label: language === 'ar' ? 'مراجعة KYC' : 'KYC Reviews', icon: <ShieldCheck size={20} /> },
    { path: "/admin/tokenization-income", label: language === 'ar' ? 'توزيع الأرباح' : 'Income Distribution', icon: <CircleDollarSign size={20} /> },
    { path: "/admin/compliance", label: language === 'ar' ? 'سجل الامتثال' : 'Compliance Logs', icon: <FileSearch size={20} /> },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Toggle */}
      {isSmallScreen && (
        <div className={styles.mobileToggle}>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu size={24} />
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
        <div className={styles.logoContainer}>
            <Logo size="sm" variant={isSmallScreen ? "compact" : "full"} />
            <span className={styles.adminBadge}>Admin</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={styles.closeBtn} 
            onClick={toggleSidebar}
          >
            <X size={24} />
          </Button>
        </div>

        <nav className={styles.nav}>
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`${styles.link} ${isActive ? styles.active : ""} ${(link as any).special ? styles.specialLink : ""}`}
                onClick={closeSidebar}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}
    </>
  );
};
