import React, { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { BottomNav } from "./BottomNav";
import styles from "./AppLayout.module.css";

export interface AppLayoutProps {
  /**
   * The content to be rendered within the layout
   */
  children: ReactNode;
  /**
   * Whether to show navigation links in the header (desktop only)
   * @default true
   */
  showNavLinks?: boolean;
  /**
   * Optional CSS class
   */
  className?: string;
}

/**
 * A layout component that provides consistent header and bottom navigation
 * across pages. Includes AppHeader with optional navigation links and BottomNav
 * for mobile navigation.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showNavLinks = true,
  className,
}) => {
  return (
    <div className={`${styles.layout} ${className || ""}`}>
      <AppHeader showNavLinks={showNavLinks} />
      <main className={styles.main}>
        {children}
        <AppFooter />
      </main>
      <BottomNav />
    </div>
  );
};