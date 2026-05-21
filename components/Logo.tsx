import React from "react";
import { Link } from "react-router-dom";
import { 
  Home, 
  Star, 
  Shield, 
  ChevronDown, 
  Search, 
  Map, 
  Bot, 
  Info, 
  Phone, 
  Crown,
  LayoutDashboard,
  Percent,
  Coins,
  ClipboardCheck,
  Clock,
  ArrowLeftRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./DropdownMenu";
import { useLanguage } from "../helpers/useLanguage";
import styles from "./Logo.module.css";

interface LogoProps {
  /**
   * Size of the logo
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Visual variant of the logo
   * - full: Icon + Arabic Text + .xyz
   * - compact: Icon + Arabic Text
   * - icon-only: Just the icon
   * @default "full"
   */
  variant?: "full" | "compact" | "icon-only";
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  variant = "full",
  className,
}) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const menuItems = [
    {
      label: isArabic ? "الرئيسية" : "Home",
      icon: <Home size={16} className={styles.menuIcon} />,
      to: "/",
    },
    {
      label: isArabic ? "البحث عن عقارات" : "Search Properties",
      icon: <Search size={16} className={styles.menuIcon} />,
      to: "/properties",
    },
    {
      label: isArabic ? "الخريطة" : "Map",
      icon: <Map size={16} className={styles.menuIcon} />,
      to: "/map",
    },
    {
      label: isArabic ? "الذكاء الاصطناعي" : "AI Features",
      icon: <Bot size={16} className={styles.menuIcon} />,
      to: "/ai",
    },
  ];

  const secondaryItems = [
    {
      label: isArabic ? "من نحن" : "About",
      icon: <Info size={16} className={styles.menuIcon} />,
      to: "/about",
    },
    {
      label: isArabic ? "اتصل بنا" : "Contact",
      icon: <Phone size={16} className={styles.menuIcon} />,
      to: "/contact",
    },
    {
      label: isArabic ? "السوق الثانوية" : "Secondary Market",
      icon: <ArrowLeftRight size={16} className={styles.menuIcon} />,
      to: "/secondary-market",
    },
  ];

  const subscriptionSubItems = [
    {
      label: isArabic ? "إضافة اشتراك" : "Add Subscription",
      icon: <ClipboardCheck size={16} className={styles.menuIcon} />,
      to: "/subscription/apply",
    },
    {
      label: isArabic ? "حالة الاشتراك" : "Subscription Status",
      icon: <Clock size={16} className={styles.menuIcon} />,
      to: "/subscription/status",
    },
  ];

  return (
    <div className={`${styles.container} ${styles[size]} ${className || ""}`}>
      <Link
        to="/"
        className={`${styles.logo} ${styles[size]} ${styles[variant]}`}
        aria-label="SKNAI Home"
      >
        <div className={styles.iconWrapper}>
          <Shield className={styles.shieldIcon} strokeWidth={0} />
          <Home className={styles.houseIcon} strokeWidth={2.5} />
          <Star className={styles.starIcon} strokeWidth={0} />
        </div>

        {variant !== "icon-only" && (
          <div className={styles.textWrapper}>
            <span className={styles.mainText}>SKNAI</span>
            {variant === "full" && <span className={styles.domainText}>.xyz</span>}
          </div>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={styles.dropdownTrigger} aria-label="Menu">
            <ChevronDown className={styles.chevronIcon} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={styles.dropdownContent} align="start">
          <DropdownMenuGroup>
            {menuItems.map((item, index) => (
              <DropdownMenuItem key={index} asChild>
                <Link to={item.to} className={styles.menuItemLink}>
                  {item.icon}
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {secondaryItems.map((item, index) => (
              <DropdownMenuItem key={index} asChild>
                <Link to={item.to} className={styles.menuItemLink}>
                  {item.icon}
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={styles.subTrigger}>
                <Crown size={16} className={styles.menuIcon} />
                <span>{isArabic ? "الاشتراكات" : "Subscriptions"}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className={styles.subContent}>
                {subscriptionSubItems.map((subItem, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <Link to={subItem.to} className={styles.menuItemLink}>
                      {subItem.icon}
                      {subItem.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
