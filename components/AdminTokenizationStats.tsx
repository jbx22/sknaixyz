import React from "react";
import { useAdminTokenizationStats } from "../helpers/useAdminTokenization";
import { Skeleton } from "./Skeleton";
import {
  Coins,
  Users,
  FileCheck,
  Wallet,
  TrendingUp,
  Building2,
} from "lucide-react";
import styles from "./AdminTokenizationStats.module.css";

export const AdminTokenizationStats = () => {
  const { data, isLoading } = useAdminTokenizationStats();

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "Total Assets",
      value: data.totalTokenizedAssets,
      icon: <Building2 className={styles.icon} />,
      color: "blue",
    },
    {
      label: "Total Value Locked",
      value: `${(data.totalValueLocked / 1000000).toFixed(1)}M SAR`,
      icon: <Coins className={styles.icon} />,
      color: "green",
    },
    {
      label: "Total Investors",
      value: data.totalInvestors,
      icon: <Users className={styles.icon} />,
      color: "purple",
    },
    {
      label: "Pending KYC",
      value: data.pendingKycCount,
      icon: <FileCheck className={styles.icon} />,
      color: "orange",
    },
    {
      label: "Wallet Balance",
      value: `${(data.totalWalletBalance / 1000).toFixed(1)}k SAR`,
      icon: <Wallet className={styles.icon} />,
      color: "cyan",
    },
    {
      label: "Income Distributed",
      value: `${(data.totalIncomeDistributed / 1000).toFixed(1)}k SAR`,
      icon: <TrendingUp className={styles.icon} />,
      color: "red",
    },
  ];

  return (
    <div className={styles.grid}>
      {stats.map((stat, index) => (
        <div key={index} className={`${styles.card} ${styles[stat.color]}`}>
          <div className={styles.content}>
            <span className={styles.label}>{stat.label}</span>
            <span className={styles.value}>{stat.value}</span>
          </div>
          <div className={styles.iconWrapper}>{stat.icon}</div>
        </div>
      ))}
    </div>
  );
};