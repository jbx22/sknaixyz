import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminStats, useInvestorStats, useOwnerBrokerStats, useRoleAdminStats, useSuperAdminStats } from "../helpers/useAdminStats";
import { useLanguage } from "../helpers/useLanguage";
import { ADMIN_STRINGS } from "../helpers/adminTranslations";
import { Skeleton } from "./Skeleton";
import { Users, Building2, CreditCard, Activity, ClipboardCheck, Coins, ShieldCheck, FileSearch, TrendingUp, Eye, Heart, Package, DollarSign, CheckCircle, AlertTriangle, Server, Database } from "lucide-react";
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
  const investorStats = useInvestorStats();
  const ownerBrokerStats = useOwnerBrokerStats();
  const roleAdminStats = useRoleAdminStats();
  const superAdminStats = useSuperAdminStats();
  
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

  // Role-specific stats cards
  const investorStatsCards = [
    { title: t.stats.propertiesViewed, value: investorStats.data.propertiesViewed.toLocaleString(), icon: <Eye className={styles.icon} />, color: "var(--primary)" },
    { title: t.stats.favorites, value: investorStats.data.favorites.toLocaleString(), icon: <Heart className={styles.icon} />, color: "var(--success)" },
    { title: t.stats.investmentsMade, value: investorStats.data.investmentsMade.toLocaleString(), icon: <TrendingUp className={styles.icon} />, color: "var(--accent)" },
    { title: t.stats.portfolioValue, value: `${(investorStats.data.portfolioValue / 1000000).toFixed(1)}M SAR`, icon: <Package className={styles.icon} />, color: "var(--warning)" },
  ];

  const ownerBrokerStatsCards = [
    { title: t.stats.propertiesListed, value: ownerBrokerStats.data.propertiesListed.toLocaleString(), icon: <Building2 className={styles.icon} />, color: "var(--primary)" },
    { title: t.stats.activeListings, value: ownerBrokerStats.data.activeListings.toLocaleString(), icon: <Activity className={styles.icon} />, color: "var(--success)" },
    { title: t.stats.inquiries, value: ownerBrokerStats.data.inquiries.toLocaleString(), icon: <Users className={styles.icon} />, color: "var(--accent)" },
    { title: t.stats.tokenizationRequests, value: ownerBrokerStats.data.tokenizationRequests.toLocaleString(), icon: <Coins className={styles.icon} />, color: "var(--warning)" },
  ];

  const adminStatsCards = [
    { title: t.stats.totalUsers, value: roleAdminStats.data.totalUsers.toLocaleString(), icon: <Users className={styles.icon} />, color: "var(--primary)" },
    { title: t.stats.pendingApprovals, value: roleAdminStats.data.pendingApprovals.toLocaleString(), icon: <ClipboardCheck className={styles.icon} />, color: "var(--warning)" },
    { title: t.stats.activeProperties, value: roleAdminStats.data.activeProperties.toLocaleString(), icon: <Building2 className={styles.icon} />, color: "var(--success)" },
    { title: t.stats.complianceAlerts, value: roleAdminStats.data.complianceAlerts.toLocaleString(), icon: <AlertTriangle className={styles.icon} />, color: "var(--danger)" },
  ];

  const superAdminStatsCards = [
    { title: t.stats.allPlatformStats, value: superAdminStats.data.allPlatformStats.toLocaleString(), icon: <Database className={styles.icon} />, color: "var(--primary)" },
    { title: t.stats.revenue, value: `${(superAdminStats.data.revenue / 1000000).toFixed(1)}M SAR`, icon: <DollarSign className={styles.icon} />, color: "var(--success)" },
    { title: t.stats.complianceOverview, value: superAdminStats.data.complianceOverview.toLocaleString(), icon: <CheckCircle className={styles.icon} />, color: "var(--accent)" },
    { title: t.stats.systemHealth, value: `${superAdminStats.data.systemHealth}%`, icon: <Server className={styles.icon} />, color: "var(--warning)" },
  ];

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
      {/* Main overview stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{ar ? "الملخص العام" : "Platform Overview"}</h2>
        <div className={styles.grid}>{statsCards.map((stat, index) => <Link key={index} to={stat.path} className={styles.card}><div className={styles.cardHeader}><span className={styles.cardTitle}>{stat.title}</span><div className={styles.iconWrapper} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>{stat.icon}</div></div><div className={styles.cardValue}>{stat.value}</div></Link>)}</div>
      </div>
      
      {/* Investor Stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{ar ? "إحصائيات المستثمرين" : "Investor Stats"}</h2>
        <div className={styles.grid}>{investorStatsCards.map((stat, index) => <div key={index} className={styles.card}><div className={styles.cardHeader}><span className={styles.cardTitle}>{stat.title}</span><div className={styles.iconWrapper} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>{stat.icon}</div></div><div className={styles.cardValue}>{stat.value}</div></div>)}</div>
      </div>
      
      {/* Owner/Broker Stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{ar ? "إحصائيات الملاك والوسطاء" : "Owner/Broker Stats"}</h2>
        <div className={styles.grid}>{ownerBrokerStatsCards.map((stat, index) => <div key={index} className={styles.card}><div className={styles.cardHeader}><span className={styles.cardTitle}>{stat.title}</span><div className={styles.iconWrapper} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>{stat.icon}</div></div><div className={styles.cardValue}>{stat.value}</div></div>)}</div>
      </div>
      
      {/* Admin Stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{ar ? "إحصائيات الإدارة" : "Admin Stats"}</h2>
        <div className={styles.grid}>{adminStatsCards.map((stat, index) => <div key={index} className={styles.card}><div className={styles.cardHeader}><span className={styles.cardTitle}>{stat.title}</span><div className={styles.iconWrapper} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>{stat.icon}</div></div><div className={styles.cardValue}>{stat.value}</div></div>)}</div>
      </div>
      
      {/* Super Admin Stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{ar ? "إحصائيات المشرفين الرئيسيين" : "Super Admin Stats"}</h2>
        <div className={styles.grid}>{superAdminStatsCards.map((stat, index) => <div key={index} className={styles.card}><div className={styles.cardHeader}><span className={styles.cardTitle}>{stat.title}</span><div className={styles.iconWrapper} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>{stat.icon}</div></div><div className={styles.cardValue}>{stat.value}</div></div>)}</div>
      </div>
      
      {/* Chart */}
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
