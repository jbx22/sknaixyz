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
  ArrowLeftRight,
  Tag,
  ChevronDown,
  PlusCircle,
  FileText
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
  const [subscriptionExpanded, setSubscriptionExpanded] = useState(true);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const isSuperadmin = authState.type === "authenticated" && authState.user.role === "superadmin";

  // Check if any subscription sub-route is active
  const isSubscriptionActive = location.pathname.startsWith("/subscription");

  const subscriptionSubLinks = [
    { path: "/subscription/apply", label: "Add Subscription", icon: <PlusCircle size={18} /> },
    { path: "/subscription/status", label: "Subscription Status", icon: <FileText size={18} /> },
  ];

  const links = [
    ...(isSuperadmin ? [{ path: "/superadmin", label: "Super Admin", icon: <ShieldAlert size={20} />, special: true }] : []),
    { path: "/admin/dashboard", label: t.dashboard, icon: <LayoutDashboard size={20} /> },
    { path: "/admin/users", label: t.users, icon: <Users size={20} /> },
    { path: "/admin/properties", label: t.properties, icon: <Building2 size={20} /> },
    { path: "/admin/activity", label: t.activityLogs, icon: <Activity size={20} /> },
    { path: "/admin/fractional-ownership", label: "Fractional Ownership", icon: <Percent size={20} /> },
    { path: "/admin/tokenization", label: "Tokenization", icon: <Coins size={20} /> },
    { path: "/admin/secondary-market", label: "Secondary Market", icon: <ArrowLeftRight size={20} /> },
    { path: "/admin/tokenization-kyc", label: "KYC Reviews", icon: <ShieldCheck size={20} /> },
    { path: "/admin/tokenization-income", label: "Income Distribution", icon: <CircleDollarSign size={20} /> },
    { path: "/admin/compliance", label: "Compliance Logs", icon: <FileSearch size={20} /> },
    { path: "/admin/rent", label: "Rent Management", icon: <CircleDollarSign size={20} /> },
    { path: "/admin/rent/contracts", label: "Contracts", icon: <ClipboardCheck size={20} /> },
    { path: "/admin/rent/invoices", label: "Invoices", icon: <Coins size={20} /> },
    { path: "/admin/rent/payments", label: "Payments", icon: <CreditCard size={20} /> },
    { path: "/admin/rent/tenants", label: "Tenants", icon: <Users size={20} /> },
    { path: "/admin/rent/investors", label: "Investors", icon: <Percent size={20} /> },
    { path: "/admin/rent/reports", label: "Reports", icon: <Activity size={20} /> },
    { path: "/admin/rent/expenses", label: "Expenses", icon: <FileSearch size={20} /> },
    { path: "/pricing", label: "Pricing & Plans", icon: <Tag size={20} /> },
    { path: "/admin/subscriptions", label: t.subscriptions, icon: <CreditCard size={20} /> },
    { path: "/admin/subscription-approvals", label: "Subscription Approvals", icon: <ClipboardCheck size={20} /> },
    { path: "/admin/pricing", label: "Manage Pricing", icon: <CircleDollarSign size={20} /> },
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

          {/* Subscription Section */}
          <div className={styles.subscriptionSection}>
            <button
              className={`${styles.link} ${styles.subscriptionToggle} ${isSubscriptionActive ? styles.active : ""}`}
              onClick={() => setSubscriptionExpanded(!subscriptionExpanded)}
              aria-expanded={subscriptionExpanded}
            >
              <CreditCard size={20} />
              <span>Subscriptions</span>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${subscriptionExpanded ? styles.chevronOpen : ""}`}
              />
            </button>
            {subscriptionExpanded && (
              <div className={styles.subLinks}>
                {subscriptionSubLinks.map((sub) => {
                  const isSubActive = location.pathname === sub.path;
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`${styles.subLink} ${isSubActive ? styles.active : ""}`}
                      onClick={closeSidebar}
                    >
                      {sub.icon}
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar} />}
    </>
  );
};