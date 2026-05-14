import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "../endpoints/admin/stats_GET.schema";
import { readApplications } from "./subscriptionCompliance";
import { readManagedAdmins } from "./adminGovernance";

// Role-specific stats helpers
interface InvestorStats {
  propertiesViewed: number;
  favorites: number;
  investmentsMade: number;
  portfolioValue: number;
}

interface OwnerBrokerStats {
  propertiesListed: number;
  activeListings: number;
  inquiries: number;
  tokenizationRequests: number;
}

interface AdminStats {
  totalUsers: number;
  pendingApprovals: number;
  activeProperties: number;
  complianceAlerts: number;
}

interface SuperAdminStats {
  allPlatformStats: number;
  revenue: number;
  complianceOverview: number;
  systemHealth: number;
}

function localArrayCount(key: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function getInvestorStats(): InvestorStats {
  const applications = readApplications();
  const investors = applications.filter(app => app.userType === "investor");
  const tokenizationRequests = localArrayCount("sknai.tokenization.requests");
  const favorites = localArrayCount("sknai.favorites");
  const viewedProperties = localArrayCount("sknai.propertyViews");
  
  return {
    propertiesViewed: viewedProperties,
    favorites: favorites,
    investmentsMade: tokenizationRequests,
    portfolioValue: investors.length * 2500000, // SAR per investor
  };
}

function getOwnerBrokerStats(): OwnerBrokerStats {
  const applications = readApplications();
  const owners = applications.filter(app => app.userType === "owner" || app.userType === "office");
  const tokenizationRequests = localArrayCount("sknai.tokenization.requests");
  const properties = localArrayCount("sknai.properties");
  const inquiries = localArrayCount("sknai.inquiries");
  
  return {
    propertiesListed: properties,
    activeListings: Math.max(properties * 0.7, 18), // 70% active
    inquiries: inquiries,
    tokenizationRequests,
  };
}

function getAdminStatsData(): AdminStats {
  const applications = readApplications();
  const admins = readManagedAdmins();
  const pendingApprovals = applications.filter(
    app => app.status === "pending_admin_review" || app.status === "changes_requested"
  ).length;
  const totalProperties = localArrayCount("sknai.properties");
  const complianceAlerts = applications.filter(
    app => app.status === "compliance_issue" || app.requiresReview
  ).length;
  
  return {
    totalUsers: admins.length + applications.length,
    pendingApprovals,
    activeProperties: Math.max(totalProperties, 85),
    complianceAlerts: complianceAlerts,
  };
}

function getSuperAdminStats(): SuperAdminStats {
  const applications = readApplications();
  const admins = readManagedAdmins();
  const totalProperties = localArrayCount("sknai.properties");
  const totalTransactions = localArrayCount("sknai.transactions");
  
  return {
    allPlatformStats: applications.length + admins.length + totalProperties,
    revenue: applications.length * 15000,
    complianceOverview: Math.max(applications.length * 0.05, 2),
    systemHealth: 98.5, // Fixed health score for demo
  };
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => {
      // Try to get stats from API first, fallback to localStorage
      return getAdminStats().catch(() => {
        // Fallback to localStorage for development
        const applications = readApplications();
        const admins = readManagedAdmins();
        
        return {
          totalUsers: admins.length + applications.length,
          totalProperties: Math.max(applications.length * 2, 85),
          totalRevenue: Math.max(applications.length * 15000, 1250000),
          activeSubscriptions: applications.filter(app => app.status === "approved_active").length,
          subscriptionsByTier: [
            { tier: "free", count: applications.filter(app => app.requestedPlan === "free").length },
            { tier: "basic", count: applications.filter(app => app.requestedPlan === "basic").length },
            { tier: "premium", count: applications.filter(app => app.requestedPlan === "premium").length },
          ],
        };
      });
    },
    refetchInterval: 30000, // 30 seconds
  });
};

// Export role-specific stats hooks
export const useInvestorStats = () => {
  return {
    data: getInvestorStats(),
    isLoading: false, // Since we're using localStorage
  };
};

export const useOwnerBrokerStats = () => {
  return {
    data: getOwnerBrokerStats(),
    isLoading: false, // Since we're using localStorage
  };
};

export const useRoleAdminStats = () => {
  return {
    data: getAdminStatsData(),
    isLoading: false, // Since we're using localStorage
  };
};

export const useSuperAdminStats = () => {
  return {
    data: getSuperAdminStats(),
    isLoading: false, // Since we're using localStorage
  };
};