import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminStats } from "../helpers/useAdminStats";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { Skeleton } from "./Skeleton";
import { Users, Building2, CreditCard, Activity, ClipboardCheck, Coins, ShieldCheck, FileSearch } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { readApplications } from "../helpers/subscriptionCompliance";
import { readAdminUsageLogs, readManagedAdmins } from "../helpers/adminGovernance";
import styles from "./AdminStats.module.css";

function localArrayCount(key: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export const AdminStats = () => {
  const { data, isLoading } = useAdminStats();
  const { language } = useLanguage();
  const t = ADMIN_STRINGS[language];
  const ar = language === "ar";

  const localStats = useMemo(() => {
    const applications = readApplications();
    const admins = readManagedAdmins();
    const logs = readAdminUsageLogs();
    const tokenizationRequests = localArrayCount("sknai.tokenization.requests");
    const fractionalRequests = localArrayCount("sknai.fractionalOwnership.applications");
    const approvedSubscriptions = applications.filter((app) => app.status === "approved_active").length;
    const pendingSubscriptions = applications.filter((app) => app.status === "pending_admin_review" || app.status === "changes_requested").length;
    return {
      totalUsers: Math.max(admins.length + applications.length, data?.totalUsers || 0),
      totalProperties: Math.max(fractionalRequests, data?.totalProperties || 0),
      totalRevenue: data?.totalRevenue || 0,
      activeSubscriptions: Math.max(approvedSubscriptions, data?.subscriptionsByTier?.reduce((sum, item) => sum + item.count, 0) || 0),
      pendingSubscriptions,
      tokenizationRequests,
      adminLogs: logs.length,
      complianceItems: applications.length + logs.length,
      subscriptionsByTier: data?.subscriptionsByTier?.length ? data.subscriptionsByTier : [
        { tier: "free", count: Math.max(1, applications.filter((app) => app.requestedPlan === "free").length) },
        { tier: "basic", count: applications.filter((app) => app.requestedPlan === "basic").length },
        { tier: "premium", count: Math.max(approvedSubscriptions, applications.filter((app) => app.requestedPlan === "premium").length) },
      ],
    };
  }, [data]);

  if (isLoading && !data) {
    return <div className={styles.grid}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} className={styles.skeletonCard} />)}</div>;
  }

  const statsCards = [
    { title: t.stats.totalUsers, value: localStats.totalUsers, icon: <Users className={styles.icon} />, color: "var(--primary)", path: "/admin/users" },
    { title: t.stats.totalProperties, value: localStats.totalProperties, icon: <Building2 className={styles.icon} />, color: "var(--primary)", path: "/admin/properties" },
    { title: t.stats.revenue, value: `${localStats.totalRevenue.toLocaleString()} SAR`, icon: <CreditCard className={styles.icon} />, color: "var(--success)", path: "/admin/subscriptions" },
    { title: t.stats.activeSubscriptions, value: localStats.activeSubscriptions, icon: <Activity className={styles.icon} />, color: "var(--accent)", path: "/admin/subscriptions" },
    { title: ar ? "موافقات الاشتراك" : "Subscription approvals", value: localStats.pendingSubscriptions, icon: <ClipboardCheck className={styles.icon} />, color: "var(--warning)", path: "/admin/subscription-approvals" },
    { title: ar ? "طلبات الترميز" : "Tokenization requests", value: localStats.tokenizationRequests, icon: <Coins className={styles.icon} />, color: "var(--primary)", path: "/admin/tokenization" },
    { title: ar ? "سجلات استخدام الإدارة" : "Admin usage logs", value: localStats.adminLogs, icon: <ShieldCheck className={styles.icon} />, color: "var(--accent)", path: "/superadmin" },
    { title: ar ? "بنود مراقبة الامتثال" : "Compliance monitor items", value: localStats.complianceItems, icon: <FileSearch className={styles.icon} />, color: "var(--success)", path: "/admin/compliance" },
  ];

  const chartData = localStats.subscriptionsByTier.map((item) => ({ name: t.tiers[item.tier as keyof typeof t.tiers] || item.tier, value: item.count }));
  const COLORS = ["var(--primary)", "var(--success)", "var(--accent)"];

  return (
    <div className={styles.container}>
      <div className={styles.grid}>{statsCards.map((stat, index) => <Link key={index} to={stat.path} className={styles.card}><div className={styles.cardHeader}><span className={styles.cardTitle}>{stat.title}</span><div className={styles.iconWrapper} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>{stat.icon}</div></div><div className={styles.cardValue}>{stat.value}</div></Link>)}</div>
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>{t.stats.activeSubscriptions}</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip contentStyle={{ backgroundColor: "var(--popup)", borderColor: "var(--border)", color: "var(--popup-foreground)" }} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
