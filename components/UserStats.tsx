import React from "react";
import { 
  Home, 
  Heart, 
  CheckCircle, 
  DollarSign, 
  TrendingUp 
} from "lucide-react";
import { useUserStats } from "../helpers/useUserStats";
import { useLanguage } from "../helpers/useLanguage";
import { dashboardTranslations } from "../helpers/dashboardTranslations";
import { Skeleton } from "./Skeleton";
import { Badge } from "./Badge";
import styles from "./UserStats.module.css";

export const UserStats: React.FC = () => {
  const { stats, isLoading } = useUserStats();
  const { language } = useLanguage();
  const t = dashboardTranslations[language];

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.card}>
            <Skeleton className={styles.skeletonIcon} />
            <div className={styles.content}>
              <Skeleton className={styles.skeletonLabel} />
              <Skeleton className={styles.skeletonValue} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: t.totalProperties,
      value: stats?.totalProperties || 0,
      icon: <Home size={24} />,
      color: "blue",
    },
    {
      label: t.totalFavorites,
      value: stats?.totalFavorites || 0,
      icon: <Heart size={24} />,
      color: "red",
    },
    {
      label: t.activeListings,
      value: stats?.availableProperties || 0,
      icon: <CheckCircle size={24} />,
      color: "green",
    },
    {
      label: t.soldRented,
      value: (stats?.soldProperties || 0) + (stats?.rentedProperties || 0),
      icon: <DollarSign size={24} />,
      color: "blue",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {statItems.map((item, index) => (
          <div key={index} className={`${styles.card} ${styles[item.color]}`}>
            <div className={styles.iconWrapper}>{item.icon}</div>
            <div className={styles.content}>
              <p className={styles.label}>{item.label}</p>
              <p className={styles.value}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      {stats?.subscriptionTier && (
        <div className={styles.subscriptionCard}>
          <div className={styles.subHeader}>
            <TrendingUp size={20} className={styles.subIcon} />
            <span className={styles.subLabel}>{t.currentPlan}</span>
          </div>
          <div className={styles.subContent}>
            <Badge 
              variant={stats.subscriptionTier === "premium" ? "default" : "secondary"}
              className={styles.tierBadge}
            >
              {stats.subscriptionTier.toUpperCase()}
            </Badge>
            <span className={styles.subDetail}>
              {stats.subscriptionTier === "free" 
                ? t.upgradePrompt 
                : t.planActive}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};