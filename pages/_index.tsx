import React from "react";
import { LandingNavigation } from "../components/LandingNavigation";
import { LandingHero } from "../components/LandingHero";
import { FeaturedProperties } from "../components/FeaturedProperties";
import { TokenInvestmentCTA } from "../components/TokenInvestmentCTA";
import { HowItWorks } from "../components/HowItWorks";
import { FeaturedLocations } from "../components/FeaturedLocations";
import { AppFooter } from "../components/AppFooter";
import styles from "./_index.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <LandingNavigation />
      <main className={styles.main}>
        <LandingHero />
        <FeaturedProperties />
        <TokenInvestmentCTA />
        <HowItWorks />
        <FeaturedLocations />
      </main>
      <AppFooter showBottomPadding={false} />
    </div>
  );
}