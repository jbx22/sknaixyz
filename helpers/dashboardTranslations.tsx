import { LanguageType } from "./useLanguage";

type DashboardTranslation = {
  welcome: string;
  dashboardSubtitle: string;
  myProperties: string;
  myFavorites: string;
  quickStats: string;
  totalProperties: string;
  totalFavorites: string;
  totalViews: string;
  activeListings: string;
  soldRented: string;
  viewAll: string;
  noProperties: string;
  noFavorites: string;
  addProperty: string;
  browseProperties: string;
  currentPlan: string;
  upgradePrompt: string;
  planActive: string;
  accountSettings: string;
};

export const dashboardTranslations: Record<LanguageType, DashboardTranslation> = {
  en: {
    welcome: "Welcome back",
    dashboardSubtitle: "Manage your properties and view your activity",
    myProperties: "My Properties",
    myFavorites: "My Favorites",
    quickStats: "Quick Stats",
    totalProperties: "Total Properties",
    totalFavorites: "Total Favorites",
    totalViews: "Total Views",
    activeListings: "Active Listings",
    soldRented: "Sold / Rented",
    viewAll: "View All",
    noProperties: "You haven't listed any properties yet.",
    noFavorites: "No favorites yet.",
    addProperty: "Add Property",
    browseProperties: "Browse Properties",
    currentPlan: "Current Plan",
    upgradePrompt: "Upgrade to list more properties",
    planActive: "Your plan is active",
    accountSettings: "Account Settings",
  },
  ar: {
    welcome: "مرحباً بك",
    dashboardSubtitle: "إدارة عقاراتك وعرض نشاطك",
    myProperties: "عقاراتي",
    myFavorites: "المفضلة",
    quickStats: "إحصائيات سريعة",
    totalProperties: "إجمالي العقارات",
    totalFavorites: "إجمالي المفضلة",
    totalViews: "إجمالي المشاهدات",
    activeListings: "عقارات نشطة",
    soldRented: "تم البيع / التأجير",
    viewAll: "عرض الكل",
    noProperties: "لم تقم بإدراج أي عقارات بعد.",
    noFavorites: "لا توجد مفضلة بعد.",
    addProperty: "إضافة عقار",
    browseProperties: "تصفح العقارات",
    currentPlan: "الخطة الحالية",
    upgradePrompt: "قم بالترقية لإدراج المزيد من العقارات",
    planActive: "خطتك نشطة",
    accountSettings: "إعدادات الحساب",
  },
};