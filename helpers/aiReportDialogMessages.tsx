import { LanguageType } from "./useLanguage";

export const aiReportDialogMessages = {
  generatingReport: {
    ar: "جاري إنشاء تقرير الذكاء الاصطناعي. قد يستغرق هذا بضع لحظات...",
    en: "AI Report is being generated. This may take a few moments...",
  },
  loadingReport: {
    ar: "جاري تحميل التقرير...",
    en: "Loading report...",
  },
  freeTierNote: {
    ar: "قم بالترقية إلى الباقة الأساسية أو البريميوم لإنشاء تقارير الذكاء الاصطناعي تلقائيًا لجميع عقاراتك",
    en: "Upgrade to Basic or Premium to generate AI reports automatically for all your properties",
  },
  limitReachedTitle: {
    ar: "لقد وصلت إلى الحد الأقصى من التقارير",
    en: "Report Limit Reached",
  },
  limitReachedMessage: {
    ar: "لقد استخدمت جميع تقارير الذكاء الاصطناعي المتاحة لهذا الشهر. يمكنك ترقية خطتك أو شراء تقارير إضافية.",
    en: "You've used all your AI reports for this month. Upgrade your plan or purchase additional reports.",
  },
  upgradeNow: {
    ar: "ترقية الآن",
    en: "Upgrade Now",
  },
  buyMoreReports: {
    ar: "شراء تقارير إضافية",
    en: "Buy More Reports",
  },
  loginRequired: {
    ar: "تسجيل الدخول مطلوب",
    en: "Login Required",
  },
  loginRequiredMessage: {
    ar: "يجب تسجيل الدخول لإنشاء تقارير الذكاء الاصطناعي للعقارات",
    en: "Please log in to generate AI reports for properties",
  },
  loginNow: {
    ar: "تسجيل الدخول",
    en: "Log In",
  },
};

export const tDialog = (
  key: keyof typeof aiReportDialogMessages,
  language: LanguageType
): string => {
  return aiReportDialogMessages[key][language];
};
