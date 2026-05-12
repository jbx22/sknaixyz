export const SUBSCRIPTION_STRINGS = {
  ar: {
    title: "خطط الاشتراك",
    subtitle: "اختر الخطة المثالية لرحلتك العقارية",
    currentPlan: "الخطة الحالية",
    propertiesUsed: "{used} / {limit} عقار مستخدم",
    propertiesUsedUnlimited: "{used} / ∞ عقار مستخدم",
    renewsOn: "يتجدد في",
    mostPopular: "الأكثر شيوعاً",
    securePayment: "دفع آمن",
    securePaymentDesc: "جميع المعاملات مشفرة وآمنة.",
    instantActivation: "تفعيل فوري",
    instantActivationDesc: "احصل على الميزات فور الترقية.",
    
    buttons: {
      currentPlan: "الخطة الحالية",
      processing: "جاري المعالجة...",
      downgrade: "تواصل مع الدعم لخفض الباقة",
      loginToUpgrade: "سجل الدخول للترقية",
      upgrade: "ترقية",
    },

    tiers: {
      free: {
        name: "مجاني",
        description: "مثالية للبدء",
        price: "0 ريال",
        period: "/للأبد",
        listingFeature: "1 إعلان عقاري",
        aiReportFeature: "10 تقارير ذكاء اصطناعي/شهر",
      },
      basic: {
        name: "أساسي",
        description: "للوكلاء العقاريين الصاعدين",
        price: "99 ريال",
        period: "/شهر",
        listingFeature: "10 إعلانات عقارية",
        aiReportFeature: "25 تقرير ذكاء اصطناعي/شهر",
      },
      premium: {
        name: "متميز",
        description: "القوة القصوى للوكالات",
        price: "299 ريال",
        period: "/شهر",
        listingFeature: "عدد غير محدود من الإعلانات",
        aiReportFeature: "100 تقرير ذكاء اصطناعي/شهر",
      }
    },

    commonFeatures: {
      viewReports: "عرض تقارير الذكاء الاصطناعي",
      shareReports: "مشاركة وطباعة التقارير",
      exportPdf: "تصدير PDF",
      emailReports: "إرسال التقارير بالبريد الإلكتروني",
      featuredListings: "إعلانات مميزة",
      tokenizedInvestments: "الاستثمارات المرمزة",
      secondaryMarketTrading: "التداول في السوق الثانوي",
      incomeDistributions: "توزيعات الأرباح",
    },

    aiReports: {
      aiReportsUsed: "{used} / {limit} تقرير ذكاء اصطناعي",
      aiReportsLimitReached: "لقد وصلت إلى الحد الأقصى من التقارير الشهرية",
      buyMoreReports: "شراء تقارير إضافية",
      perReport: "ريال/تقرير",
      reportsReset: "يتم تجديد التقارير في",
    },

    extraReports: {
      extraReportPrice: "10 ريال",
      extraReportPricePremium: "5 ريال",
      purchaseSuccess: "تم شراء {count} تقرير بنجاح",
    },

    comparison: {
      featuresTableTitle: "مقارنة الميزات",
      feature: "الميزة",
      propertyListings: "الإعلانات العقارية",
      aiReports: "تقارير الذكاء الاصطناعي",
      unlimited: "غير محدود",
    }
  },
  en: {
    title: "Subscription Plans",
    subtitle: "Choose the perfect plan for your real estate journey",
    currentPlan: "Current Plan",
    propertiesUsed: "{used} / {limit} Properties Used",
    propertiesUsedUnlimited: "{used} / ∞ Properties Used",
    renewsOn: "Renews on",
    mostPopular: "Most Popular",
    securePayment: "Secure Payment",
    securePaymentDesc: "All transactions are encrypted and secured.",
    instantActivation: "Instant Activation",
    instantActivationDesc: "Get access to features immediately after upgrade.",

    buttons: {
      currentPlan: "Current Plan",
      processing: "Processing...",
      downgrade: "Contact Support to Downgrade",
      loginToUpgrade: "Log in to Upgrade",
      upgrade: "Upgrade",
    },

    tiers: {
      free: {
        name: "Free",
        description: "Perfect for getting started",
        price: "0 SAR",
        period: "/forever",
        listingFeature: "1 Property Listing",
        aiReportFeature: "10 AI Reports/month",
      },
      basic: {
        name: "Basic",
        description: "For growing real estate agents",
        price: "99 SAR",
        period: "/month",
        listingFeature: "10 Property Listings",
        aiReportFeature: "25 AI Reports/month",
      },
      premium: {
        name: "Premium",
        description: "Ultimate power for agencies",
        price: "299 SAR",
        period: "/month",
        listingFeature: "Unlimited Listings",
        aiReportFeature: "100 AI Reports/month",
      }
    },

    commonFeatures: {
      viewReports: "View AI Reports",
      shareReports: "Share & Print Reports",
      exportPdf: "Export PDF",
      emailReports: "Email Reports",
      featuredListings: "Featured Listings",
      tokenizedInvestments: "Tokenized Investments",
      secondaryMarketTrading: "Secondary Market Trading",
      incomeDistributions: "Income Distributions",
    },

    aiReports: {
      aiReportsUsed: "{used} / {limit} AI Reports",
      aiReportsLimitReached: "You've reached your monthly report limit",
      buyMoreReports: "Buy More Reports",
      perReport: "SAR/report",
      reportsReset: "Reports reset on",
    },

    extraReports: {
      extraReportPrice: "10 SAR",
      extraReportPricePremium: "5 SAR",
      purchaseSuccess: "Successfully purchased {count} reports",
    },

    comparison: {
      featuresTableTitle: "Features Comparison",
      feature: "Feature",
      propertyListings: "Property Listings",
      aiReports: "AI Reports",
      unlimited: "Unlimited",
    }
  }
} as const;