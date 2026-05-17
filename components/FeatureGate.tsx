import React from "react";
import { useFeatureAccess } from "../helpers/useSubscriptions";
import { Lock } from "lucide-react";
import css from "./FeatureGate.module.css";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export default function FeatureGate({ feature, children, fallback, showUpgrade = true }: FeatureGateProps) {
  const { data, isLoading } = useFeatureAccess(feature);

  if (isLoading) return <div className={css.loading}>Loading...</div>;

  if (data?.allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  if (!showUpgrade) return null;

  return (
    <div className={css.locked}>
      <div className={css.lockContent}>
        <Lock size={20} />
        <span className={css.lockText}>
          {data?.planTier === "free" ? "Upgrade to access this feature" : "Available on a higher plan"}
        </span>
        <a href="/pricing" className={css.upgradeLink}>View Plans</a>
      </div>
    </div>
  );
}
