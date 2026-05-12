import { LanguageType } from "./useLanguage";

type AddPropertyTranslation = {
  pageTitle: string;
  step1: string;
  step2: string;
  pickLocation: string;
  pickLocationDesc: string;
  propertyDetails: string;
  searchPlaceholder: string;
  useCurrentLocation: string;
  locating: string;
  enterManually: string;
  hideManual: string;
  latitude: string;
  longitude: string;
  mapHelper: string;
  continue: string;
  back: string;
  cancel: string;
  nearMe: string;
};

export const addPropertyTranslations: Record<LanguageType, AddPropertyTranslation> = {
  en: {
    pageTitle: "Add New Property",
    step1: "Location",
    step2: "Details",
    pickLocation: "Choose Location",
    pickLocationDesc: "Pinpoint the exact location of your property on the map or enter coordinates manually.",
    propertyDetails: "Property Details",
    searchPlaceholder: "Search location name...",
    useCurrentLocation: "Use Current Location",
    locating: "Locating...",
    enterManually: "Or enter coordinates manually",
    hideManual: "Hide manual entry",
    latitude: "Latitude",
    longitude: "Longitude",
    mapHelper: "Click anywhere on the map to update the marker position.",
    continue: "Continue",
    back: "Back",
    cancel: "Cancel",
    nearMe: "Near Me",
  },
  ar: {
    pageTitle: "إضافة عقار جديد",
    step1: "الموقع",
    step2: "التفاصيل",
    pickLocation: "اختر الموقع",
    pickLocationDesc: "حدد موقع عقارك بدقة على الخريطة أو أدخل الإحداثيات يدوياً.",
    propertyDetails: "تفاصيل العقار",
    searchPlaceholder: "ابحث عن اسم الموقع...",
    useCurrentLocation: "استخدم موقعي الحالي",
    locating: "جاري تحديد الموقع...",
    enterManually: "أو أدخل الإحداثيات يدوياً",
    hideManual: "إخفاء الإدخال اليدوي",
    latitude: "خط العرض",
    longitude: "خط الطول",
    mapHelper: "انقر في أي مكان على الخريطة لتحديث موقع المؤشر.",
    continue: "متابعة",
    back: "رجوع",
    cancel: "إلغاء",
    nearMe: "بالقرب مني",
  },
};