/**
 * SKNAI Tiered Prompt Templates for AI Property Reports.
 *
 * Two tiers:
 *   FREE  – General overview with basic pricing, positive tone
 *   PREMIUM – Full real estate intelligence with investment-grade analysis
 *
 * Architecture:
 *   1. Real data is pre-collected from OpenStreetMap (Overpass API)
 *   2. Market prices estimated per country/city (from backend)
 *   3. Phone/Internet providers detected from country code
 *   4. DeepSeek V4 Flash formats it into a beautiful, structured report
 *   5. The AI does NOT invent data — it only formats what's given
 *
 * Works globally for ANY city/country. Not limited to Saudi Arabia.
 */

import type { CollectedData } from "./dataCollector";

export type ReportTier = "free" | "premium";

export interface GeneratePromptInput {
  tier: ReportTier;
  language: "ar" | "en";
  property: {
    id: number;
    title?: string;
    description?: string;
    locationName: string;
    latitude: number;
    longitude: number;
    price: number;
    areaSqm: number;
    pricePerSqm: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
    propertyType?: string;
    amenities?: string[];
    yearBuilt?: number | null;
    furnished?: boolean;
    floorNumber?: number | null;
  };
  osmData: Partial<CollectedData>;
  /** Market context is provided for ALL tiers now (free gets basic, premium gets advanced) */
  marketContext: {
    similarRentMin: number;
    similarRentMax: number;
    similarRentAvg: number;
    similarSaleMin: number;
    similarSaleMax: number;
    similarSaleAvg: number;
    currency: string;
    currencySymbol: string;
    country: string;
    city: string;
    internetProviders: string[];
    phoneProviders: string[];
  };
  userContext?: {
    userName?: string;
    investorProfile?: string;
  };
}

// ─── LOCALIZED STRING HELPERS ──────────────────────────────────────

function t(str: { ar: string; en: string }, lang: "ar" | "en"): string {
  return str[lang];
}

// ─── SYSTEM PROMPTS ────────────────────────────────────────────────

const SYSTEM_PROMPT_BASE: Record<"ar" | "en", string> = {
  ar: `أنت خبير عقاري عالمي من الطراز الأول مُتخصص في تحليل العقارات السكنية والتجارية.
مهمتك: تحويل بيانات عقارية حقيقية (من خرائط الشارع المفتوحة OSM وأسعار السوق) إلى تقرير عقاري احترافي غني بالمعلومات.

قواعد أساسية صارمة:
1. **لا تختلق أي معلومات** — استخدم فقط البيانات المقدمة لك عن الموقع والمرافق والأسعار.
2. **إذا كانت البيانات ناقصة، اذكر ذلك بشفافية** بدلاً من الافتراض أو التخمين.
3. **كن إيجابياً وبنّاءً دائماً** — ركّز على نقاط القوة والفرص في الحي والموقع.
4. **استخدم لغة تناسب البلد** — إذا كان العقار في دولة غير ناطقة بالعربية، استخدم المزيج المناسب.
5. **التنسيق مهم جداً** — استخدم التنسيقات المناسبة للإنفوجرافيك (رموز تعبيرية، أرقام منظمة، جداول بسيطة).
6. **المسافات والمواقع**: جميع المسافات المقدمة حقيقية ومأخوذة من OpenStreetMap.
7. **عند تقديم نصائح استثمارية** — اجعلها دقيقة وواقعية مع تحذير واضح أنها غير ملزمة واستشارية.
8. **العملة**: استخدم رمز العملة المقدم في البيانات (مثلاً $, €, £, SAR).`,

  en: `You are a world-class global real estate expert specializing in residential and commercial property analysis across all countries.
Your mission: Transform real property data (from OpenStreetMap open mapping and market prices) into a professional, rich, infographic-ready property report.

Strict rules:
1. **Do NOT fabricate any information** — use only the data provided about the location, amenities, and prices.
2. **If data is incomplete, state it transparently** instead of assuming or guessing.
3. **Always be positive and constructive** — focus on strengths and opportunities.
4. **Use language appropriate to the country** — adapt terminology to local real estate norms.
5. **Formatting matters** — use infographic-friendly formatting (emojis, organized numbers, simple tables).
6. **All distances and locations are real** — sourced from OpenStreetMap open data.
7. **When giving investment advice** — make it accurate, realistic, with a clear advisory disclaimer.
8. **Currency**: Use the currency symbol provided in the data (e.g. $, €, £, SAR).`,
};

const FREE_SYSTEM_EXTENSION: Record<"ar" | "en", string> = {
  ar: `
هذا تقرير عام مجاني. ركز على:
- إعطاء نظرة عامة إيجابية عن الحي والموقع
- ذكر أبرز 5-7 مرافق قريبة مع المسافات الحقيقية
- **تضمين نطاق أسعار الإيجار والبيع للعقارات المشابهة** (من البيانات المقدمة)
- تقييم عام للحي من حيث الأمان والمشي والخدمات
- ذكر أفضل مزودي خدمات الإنترنت والهاتف في المنطقة
- معلومات مفيدة للمشتري أو المستأجر المحتمل
- اجعل التقرير سهل القراءة وجذاباً بصرياً
- يجب أن يكون الإخراج بصيغة JSON تحتوي على المفاتيح التالية:
- "propertySummary": { "positiveHeadline": "نص مع رموز تعبيرية", "locationDescription": "نص" }
- "marketPrices": { "currency": "نص", "currencySymbol": "نص", "similarRentRange": { "min": رقم, "max": رقم, "avg": رقم }, "similarSaleRange": { "min": رقم, "max": رقم, "avg": رقم } }
- "nearbyAmenities": { "education": [{ "name": "نص", "type": "نص", "distanceKm": رقم }], "healthcare": [...], "shoppingDining": { "malls": [...], "restaurants": رقم, "restaurantNames": ["اسم", ...] }, "parksRecreation": [...], "transportation": { "metroStations": [...], "busStops": [...], "majorRoads": [...] }, "essentialServices": { "banks": [...], "mosques": [...], "petrolStations": [...], "policeStations": [...], "governmentOffices": [...] }, "entertainmentSports": { "cinemas": [...], "sportsFacilities": [...], "hotels": [...] } }
- "connectivity": { "internetProviders": ["نص", ...], "phoneProviders": ["نص", ...] }
- "scores": { "safetyRating": 1-10, "walkabilityScore": 1-10, "noiseLevel": 1-10, "airQualityIndex": رقم, "qualityOfLifeScore": 1-10 }
- "trafficConditions": "نص مع رموز تعبيرية"
- "climateNotes": "نص مع رموز تعبيرية"
- "areaDescription": "نص مع رموز تعبيرية"
- "positiveSummary": "نص مع رموز تعبيرية"

يجب أن تحتوي النصوص على رموز تعبيرية للتنسيق البصري. استخدم الرموز داخل النصوص وليس كمفاتيح منفصلة.`,
  en: `
This is a FREE general report. Focus on:
- A positive overview of the neighborhood and location
- Top 5-7 nearby amenities with real distances
- **Include the rent and sale price range for similar properties** (from data provided)
- General area rating for safety, walkability, and services
- Mention the best internet and phone service providers in the area
- Useful information for a potential buyer or renter
- Make it easy to read and visually appealing
- Output a JSON object with these root-level keys:
- "propertySummary": { "positiveHeadline": "string with emoji", "locationDescription": "string" }
- "marketPrices": { "currency": "string", "currencySymbol": "string", "similarRentRange": { "min": number, "max": number, "avg": number }, "similarSaleRange": { "min": number, "max": number, "avg": number } }
- "nearbyAmenities": { "education": [{ "name": "string", "type": "string", "distanceKm": number }], "healthcare": [...], "shoppingDining": { "malls": [...], "restaurants": number, "restaurantNames": ["name1", ...] }, "parksRecreation": [...], "transportation": { "metroStations": [...], "busStops": [...], "majorRoads": [...] }, "essentialServices": { "banks": [...], "mosques": [...], "petrolStations": [...], "policeStations": [...], "governmentOffices": [...] }, "entertainmentSports": { "cinemas": [...], "sportsFacilities": [...], "hotels": [...] } }
- "connectivity": { "internetProviders": ["string", ...], "phoneProviders": ["string", ...] }
- "scores": { "safetyRating": 1-10, "walkabilityScore": 1-10, "noiseLevel": 1-10, "airQualityIndex": number, "qualityOfLifeScore": 1-10 }
- "trafficConditions": "string with emoji"
- "climateNotes": "string with emoji"
- "areaDescription": "string with emoji"
- "positiveSummary": "string with emoji"

Each text value (positiveHeadline, locationDescription, positiveSummary, etc.) should contain rich text WITH emojis for display. Use emojis INSIDE the strings, NOT as separate keys.`,
};

const PREMIUM_SYSTEM_EXTENSION: Record<"ar" | "en", string> = {
  ar: `
هذا تقرير ذكاء عقاري ممتاز للمشتركين المميزين. ركز على:
- تحليل استثماري احترافي شامل
- توصيات استراتيجية للمشتري والمستثمر
- تحليل السوق ومقارنة الأسعار التفصيلية
- تقييم المخاطر وفرص النمو
- مقارنة بالمناطق والأحياء المشابهة
- مشاريع التطوير المستقبلية وتأثيرها
- نصائح التفاوض
- بيانات جاهزة للإنفوجرافيك (نقاط رادار، أرقام مئوية)
- معلومات مفصلة عن مزودي الخدمات والاتصالات

استخدم التنسيق التالي مع الرموز التعبيرية:

يجب أن يكون الإخراج بصيغة JSON تحتوي على المفاتيح التالية:
- "executiveSummary": "نص مع رموز تعبيرية"
- "propertySummary": { "positiveHeadline": "نص", "locationDescription": "نص", "uniqueSellingPoints": ["نص", ...] }
- "marketAnalysis": { "currentPrice": رقم, "rentalYieldEstimate": رقم, "similarPropertiesRentRange": { "min": رقم, "max": رقم, "avg": رقم } }
- "investmentAnalysis": { "roiProjection5Years": "نص", "incomePotential": "نص", "riskLevel": "نص" }
- "nearbyAmenities": { "education": [{ "name": "نص", "distanceKm": رقم }], "shoppingDining": { "restaurants": رقم }, ... }
- "scores": { "safetyRating": 1-10, "walkabilityScore": 1-10, ... }
- "riskAssessment": { "overallRisk": "نص", "riskMitigationTips": ["نص", ...] }
- "strategicRecommendations": { "forBuyer": ["نص", ...], "forInvestor": ["نص", ...] }
- "positiveSummary": "نص مع رموز تعبيرية"
وغيرها من الحقول الأخرى في بنية JSON.

يجب أن تحتوي النصوص على رموز تعبيرية للتنسيق البصري.`,
  en: `
This is a PREMIUM real estate intelligence report for premium subscribers. Focus on:
- Comprehensive professional investment analysis
- Strategic recommendations for buyers and investors
- Detailed market analysis and price comparison
- Risk assessment and growth opportunities
- Comparison with similar neighborhoods/areas
- Future development projects and their impact
- Negotiation tips
- Infographic-ready data (radar scores, percentages, structured data)
- Detailed internet/phone provider analysis

Use the following format with emojis:

Output a JSON object with these root-level keys:
- "executiveSummary": "string with emoji"
- "propertySummary": { "positiveHeadline": "string with emoji", "locationDescription": "string", "uniqueSellingPoints": ["string", ...] }
- "marketAnalysis": { "currentPrice": number, "pricePerSqm": number, "areaAvgPricePerSqm": number, "priceComparisonStatus": "string", "priceDifferencePercent": number, "similarPropertiesRentRange": { "min": number, "max": number, "avg": number }, "similarPropertiesSaleRange": { "min": number, "max": number, "avg": number }, "rentalYieldEstimate": number, "marketTrend": "string", "priceAppreciationForecast": "string" }
- "investmentAnalysis": { "roiProjection5Years": "string", "breakEvenPoint": "string", "incomePotential": "string", "capitalGrowthPotential": "string", "riskLevel": "string", "investmentHorizon": "string" }
- "nearbyAmenities": { "education": [{ "name": "string", "type": "string", "distanceKm": number }], "healthcare": [...], "shoppingDining": { "malls": [{ "name": "string", "distanceKm": number }], "supermarkets": [{ "name": "string", "distanceKm": number }], "restaurants": number, "restaurantNames": ["name", ...], "cafeNames": ["name", ...] }, "parksRecreation": [...], "transportation": { "metroStations": [...], "busStops": [...], "majorRoads": [...] }, "essentialServices": { "banks": [...], "mosques": [...], "petrolStations": [...], "policeStations": [...], "governmentOffices": [...], "postOffices": [...], "libraries": [...] } }
- "connectivity": { "internetProviders": ["string", ...], "phoneProviders": ["string", ...], "averageSpeed": "string" }
- "scores": { "safetyRating": 1-10, "walkabilityScore": 1-10, "noiseLevel": 1-10, "airQualityIndex": number, "qualityOfLifeScore": 1-10, "trafficConditions": "string", "climateNotes": "string" }
- "scoresRadar": { "investmentPotential": 1-10, "locationQuality": 1-10, "infrastructure": 1-10, "communityVibe": 1-10, "growthProspect": 1-10, "accessibility": 1-10, "valueForMoney": 1-10 }
- "developmentPipeline": { "currentDevelopments": ["string", ...], "plannedDevelopments": ["string", ...], "impactOnValue": "string" }
- "neighborhoodDeepDive": { "demographics": "string with emoji", "communityVibe": "string with emoji", "futureOutlook": "string with emoji", "comparableNeighborhoods": ["string", ...] }
- "riskAssessment": { "overallRisk": "Low|Medium|High", "marketRisk": "string", "locationRisk": "string", "liquidityRisk": "string", "riskMitigationTips": ["string", ...] }
- "strategicRecommendations": { "forBuyer": ["string", ...], "forInvestor": ["string", ...], "negotiationTips": ["string", ...] }
- "investmentGrade": "string"
- "areaAnalysis": "string with emoji"
- "positiveSummary": "string with emoji"

Each text value should contain rich text WITH emojis for display. Use emojis INSIDE the strings.`,
};

// ─── USER PROMPT BUILDER ─────────────────────────────────────────────

export function buildSystemPrompt(tier: ReportTier, language: "ar" | "en"): string {
  const base = SYSTEM_PROMPT_BASE[language];
  const extension =
    tier === "free" ? FREE_SYSTEM_EXTENSION[language] : PREMIUM_SYSTEM_EXTENSION[language];
  return `${base}\n${extension}`;
}

export function buildUserPrompt(input: GeneratePromptInput): string {
  const { tier, language, property, osmData, marketContext, userContext } = input;
  const p = property;

  // ─── PROPERTY DATA SECTION ─────────────────────────────────────────
  const propertySection = language === "ar"
    ? `## 🏡 بيانات العقار الأساسية
- **العنوان**: ${p.locationName}
- **الإحداثيات**: ${p.latitude}, ${p.longitude}
- **السعر**: ${p.price.toLocaleString()} ${marketContext.currencySymbol}
- **المساحة**: ${p.areaSqm} متر مربع
- **سعر المتر المربع**: ${p.pricePerSqm.toLocaleString()} ${marketContext.currencySymbol}/م²
${p.bedrooms ? `- **غرف النوم**: ${p.bedrooms}` : ""}
${p.bathrooms ? `- **الحمامات**: ${p.bathrooms}` : ""}
${p.propertyType ? `- **نوع العقار**: ${translatePropertyType(p.propertyType, language)}` : ""}
${p.yearBuilt ? `- **سنة البناء**: ${p.yearBuilt}` : ""}
${p.furnished !== undefined ? `- **أثاث**: ${p.furnished ? "مفروش" : "غير مفروش"}` : ""}
${p.floorNumber ? `- **الدور**: ${p.floorNumber}` : ""}
${p.amenities?.length ? `- **المرافق**: ${p.amenities.join("، ")}` : ""}
- **البلد**: ${marketContext.country || "غير محدد"}`
    : `## 🏡 Property Details
- **Location**: ${p.locationName}
- **Coordinates**: ${p.latitude}, ${p.longitude}
- **Price**: ${p.price.toLocaleString()} ${marketContext.currencySymbol}
- **Area**: ${p.areaSqm} sqm
- **Price per sqm**: ${p.pricePerSqm.toLocaleString()} ${marketContext.currencySymbol}/sqm
${p.bedrooms ? `- **Bedrooms**: ${p.bedrooms}` : ""}
${p.bathrooms ? `- **Bathrooms**: ${p.bathrooms}` : ""}
${p.propertyType ? `- **Type**: ${capitalize(p.propertyType)}` : ""}
${p.yearBuilt ? `- **Year Built**: ${p.yearBuilt}` : ""}
${p.furnished !== undefined ? `- **Furnished**: ${p.furnished ? "Yes" : "No"}` : ""}
${p.floorNumber ? `- **Floor**: ${p.floorNumber}` : ""}
${p.amenities?.length ? `- **Amenities**: ${p.amenities.join(", ")}` : ""}
- **Country**: ${marketContext.country || "Not specified"}`;

  // ─── MARKET CONTEXT SECTION (BOTH TIERS) ───────────────────────────
  const marketSection = buildMarketSection(tier, language, marketContext);

  // ─── OSM NEARBY AMENITIES SECTION ──────────────────────────────────
  const osmSection = buildOSMDataSection(osmData, language, marketContext.internetProviders, marketContext.phoneProviders);

  // ─── USER CONTEXT ─────────────────────────────────────────────────
  const userSection = userContext?.userName && tier === "premium"
    ? language === "ar"
      ? `\n👤 **تقرير مخصص لـ**: ${userContext.userName}${
          userContext.investorProfile ? ` (${userContext.investorProfile})` : ""
        }`
      : `\n👤 **Report for**: ${userContext.userName}${
          userContext.investorProfile ? ` (${userContext.investorProfile})` : ""
        }`
    : "";

  // ─── INSTRUCTION SECTION ──────────────────────────────────────────
  const instruction = language === "ar"
    ? `
## 📋 تعليمات التوليد

الآن قم بإنشاء تقرير عقاري ${
      tier === "premium" ? "ممتاز (ذكاء عقاري متكامل)" : "عام"
    } باستخدام البيانات الحقيقية أعلاه.

تنبيهات هامة:
- **لا تخترع أي بيانات** — استخدم فقط ما هو مقدم
- **إذا كانت البيانات ناقصة**، اذكر ذلك (مثلاً: "لا تتوفر بيانات عن مشاريع التطوير في هذه المنطقة")
- **كن إيجابياً** — ركز على الفرص والإمكانات
- **استخدم الرموز التعبيرية** للتقسيم البصري (مناسبة للإنفوجرافيك)
- **أعط تقييمات عددية** (من 1-10) حيثما طُلب منك
- **النص يجب أن يكون جاهزاً للعرض** مباشرة في واجهة المستخدم

${tier === "premium" 
  ? "للتقرير الممتاز، تأكد من تغطية جميع الأقسام المذكورة في تعليمات النظام بما فيها التحليل السوقي والاستثماري وتقييم المخاطر والتوصيات الاستراتيجية." 
  : "للتقرير العام، ركز على الوضوح والإيجابية مع ذكر أهم المعلومات بما فيها أسعار السوق."}

يجب أن يكون الرد بصيغة JSON صالحة فقط، بدون أي نص خارج JSON.
`
    : `
## 📋 Generation Instructions

Now create a ${tier === "premium" ? "PREMIUM (full real estate intelligence)" : "FREE (general)"} report using the real data provided above.

Important:
- **Do NOT invent data** — use only what's provided
- **If data is incomplete**, state it transparently (e.g., "No development data available for this area")
- **Be positive** — focus on opportunities and potential
- **Use emojis** for visual section breaks (infographic-ready)
- **Provide numerical scores** (1-10) where requested
- **Text must be display-ready** for the front-end UI

${tier === "premium" 
  ? "For premium reports, ensure coverage of ALL sections mentioned in the system instructions including market analysis, investment analysis, risk assessment, and strategic recommendations." 
  : "For free reports, focus on clarity and positivity with the most important information including market prices."}

Response must be valid JSON only, with no text outside the JSON block.
`;

  // ─── ASSEMBLE ──────────────────────────────────────────────────────
  return `${propertySection}\n${marketSection}\n${osmSection}${userSection}\n${instruction}`;
}

// ─── MARKET SECTION ──────────────────────────────────────────────────

function buildMarketSection(
  tier: ReportTier,
  language: "ar" | "en",
  market: GeneratePromptInput["marketContext"]
): string {
  const formatPrice = (v: number) => v.toLocaleString();

  if (language === "ar") {
    return `\n## 📊 بيانات سوق العقارات (تقديرات المنطقة)
- **البلد**: ${market.country || "غير محدد"} — **المدينة**: ${market.city || "غير محددة"}
- **العملة**: ${market.currencySymbol} (${market.currency})

💰 **نطاق إيجار العقارات المشابهة شهرياً**:
• الحد الأدنى: ${market.similarRentMin > 0 ? formatPrice(market.similarRentMin) : "غير متوفر"} ${market.currencySymbol}
• الحد الأقصى: ${market.similarRentMax > 0 ? formatPrice(market.similarRentMax) : "غير متوفر"} ${market.currencySymbol}
• المتوسط: ${market.similarRentAvg > 0 ? formatPrice(market.similarRentAvg) : "غير متوفر"} ${market.currencySymbol}

🏠 **نطاق أسعار بيع العقارات المشابهة**:
• الحد الأدنى: ${market.similarSaleMin > 0 ? formatPrice(market.similarSaleMin) : "غير متوفر"} ${market.currencySymbol}
• الحد الأقصى: ${market.similarSaleMax > 0 ? formatPrice(market.similarSaleMax) : "غير متوفر"} ${market.currencySymbol}
• المتوسط: ${market.similarSaleAvg > 0 ? formatPrice(market.similarSaleAvg) : "غير متوفر"} ${market.currencySymbol}

${tier === "premium" 
  ? "⚠️ ملاحظة: الأسعار تقديرية بناءً على متوسطات المنطقة. يُنصح بالرجوع إلى مصادر محلية للبيانات الدقيقة."
  : "ℹ️ الأسعار تقديرية — للبيانات الدقيقة يُرجى استشارة المكاتب العقارية المحلية."}

📶 **مزودو الإنترنت**: ${market.internetProviders.map(p => `📡 ${p}`).join("، ") || "غير متوفر"}
📱 **مزودو الهاتف المحمول**: ${market.phoneProviders.map(p => `📱 ${p}`).join("، ") || "غير متوفر"}`;
  } else {
    return `\n## 📊 Real Estate Market Data (Area Estimates)
- **Country**: ${market.country || "Not specified"} — **City**: ${market.city || "Not specified"}
- **Currency**: ${market.currencySymbol} (${market.currency})

💰 **Similar Properties — Monthly Rent Range**:
• Min: ${market.similarRentMin > 0 ? `${formatPrice(market.similarRentMin)} ${market.currencySymbol}` : "N/A"}
• Max: ${market.similarRentMax > 0 ? `${formatPrice(market.similarRentMax)} ${market.currencySymbol}` : "N/A"}
• Average: ${market.similarRentAvg > 0 ? `${formatPrice(market.similarRentAvg)} ${market.currencySymbol}` : "N/A"}

🏠 **Similar Properties — Sale Price Range**:
• Min: ${market.similarSaleMin > 0 ? `${formatPrice(market.similarSaleMin)} ${market.currencySymbol}` : "N/A"}
• Max: ${market.similarSaleMax > 0 ? `${formatPrice(market.similarSaleMax)} ${market.currencySymbol}` : "N/A"}
• Average: ${market.similarSaleAvg > 0 ? `${formatPrice(market.similarSaleAvg)} ${market.currencySymbol}` : "N/A"}

${tier === "premium"
  ? "⚠️ Note: Prices are estimates based on area averages. Consult local sources for precise data."
  : "ℹ️ Prices are estimates — consult local real estate offices for exact data."}

📶 **Internet Providers**: ${market.internetProviders.join(", ") || "Not available"}
📱 **Mobile Phone Providers**: ${market.phoneProviders.join(", ") || "Not available"}`;
  }
}

// ─── OSM SECTION ─────────────────────────────────────────────────────

function buildOSMDataSection(
  data: Partial<CollectedData>,
  lang: "ar" | "en",
  internetProviders: string[],
  phoneProviders: string[]
): string {
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const parts: string[] = [
    `\n## ${t("📍 الموقع والمرافق القريبة (بيانات حقيقية من OpenStreetMap)", "📍 Property Location & Nearby Amenities (Real Data from OpenStreetMap)")}`,
  ];

  const pushSection = (
    nameAr: string,
    nameEn: string,
    emoji: string,
    items: { name?: string; distanceKm?: number; tags?: Record<string, string> }[],
    max: number,
    extraFormatter?: (item: typeof items[0]) => string
  ) => {
    if (!items || items.length === 0) return;
    const limited = items.slice(0, max);
    parts.push(
      `\n${emoji} **${t(nameAr, nameEn)}**${t(":", ":")}` + 
      limited.map((item) => {
        const name = item.tags?.name || item.tags?.["name:en"] || item.tags?.["name:ar"] || "—";
        const dist = item.distanceKm !== undefined ? `${item.distanceKm.toFixed(1)}km` : "";
        const extra = extraFormatter ? ` (${extraFormatter(item)})` : "";
        return `\n  • ${name} — ${dist}${extra}`;
      }).join("")
    );
  };

  pushSection("المدارس", "Schools", "🏫", data.schools || [], 5);
  pushSection("الجامعات والكليات", "Universities", "🎓", data.universities || [], 3);
  pushSection("المستشفيات", "Hospitals", "🏥", data.hospitals || [], 3);
  pushSection("العيادات", "Clinics", "🩺", data.clinics || [], 3);
  pushSection("الصيدليات", "Pharmacies", "💊", data.pharmacies || [], 3);
  pushSection("المطاعم", "Restaurants", "🍽️", data.restaurants || [], 10);
  pushSection("المقاهي", "Cafes", "☕", data.cafes || [], 5);
  pushSection("المولات التجارية", "Malls", "🛍️", data.malls || [], 3);
  pushSection("المتاجر الكبرى", "Supermarkets", "🏪", data.supermarkets || [], 3);
  pushSection("الحدائق", "Parks", "🌳", data.parks || [], 5);
  pushSection("الحدائق العامة", "Gardens", "🌺", data.gardens || [], 3);

  // Transport
  if ((data.metroStations && data.metroStations.length > 0) || (data.busStops && data.busStops.length > 0)) {
    parts.push(`\n🚇 **${t("النقل العام", "Public Transport")}**:`);
    data.metroStations?.slice(0, 3).forEach((s) => {
      parts.push(`  • 🚉 ${s.tags?.name || "—"} — ${s.distanceKm?.toFixed(1)}km`);
    });
    data.busStops?.slice(0, 5).forEach((b) => {
      parts.push(`  • 🚌 ${b.tags?.name || "—"} — ${b.distanceKm?.toFixed(1)}km`);
    });
  }

  // Major roads
  const allRoads = [...(data.majorRoads || []), ...(data.highways || [])];
  pushSection("الطرق الرئيسية", "Major Roads", "🛣️", allRoads, 5, (r) => r.tags?.highway || "road");

  // Services
  pushSection("البنوك", "Banks", "🏦", data.banks || [], 3);
  pushSection("المساجد/دور العبادة", "Places of Worship", "🕌", data.mosques || [], 5);
  pushSection("محطات الوقود", "Petrol Stations", "⛽", data.petrolStations || [], 3);
  pushSection("مراكز الشرطة", "Police Stations", "👮", data.policeStations || [], 2);
  pushSection("المكاتب الحكومية", "Government Offices", "🏛️", data.governmentOffices || [], 3);
  pushSection("الفنادق", "Hotels", "🏨", data.hotels || [], 3);

  // Entertainment
  if ((data.cinemas && data.cinemas.length > 0) || (data.sportsFacilities && data.sportsFacilities.length > 0)) {
    parts.push(`\n🎬 **${t("الترفيه والرياضة", "Entertainment & Sports")}**:`);
    data.cinemas?.slice(0, 3).forEach((c) => {
      parts.push(`  • 🎬 ${c.tags?.name || "—"} — ${c.distanceKm?.toFixed(1)}km`);
    });
    data.sportsFacilities?.slice(0, 3).forEach((s) => {
      parts.push(`  • 🏟️ ${s.tags?.name || "—"} — ${s.distanceKm?.toFixed(1)}km`);
    });
  }

  // Connectivity — COUNTRY-SPECIFIC providers now
  const internetStr = internetProviders.length > 0
    ? internetProviders.join(", ")
    : t("غير متوفر", "Not available");
  const phoneStr = phoneProviders.length > 0
    ? phoneProviders.join(", ")
    : t("غير متوفر", "Not available");

  parts.push(
    `\n📶 **${t("مزودو خدمات الإنترنت", "Internet Service Providers")}**: ${internetStr}`
  );
  parts.push(
    `📱 **${t("مزودو خدمات الهاتف المحمول", "Mobile Phone Providers")}**: ${phoneStr}`
  );

  if (!data.schools?.length) {
    parts.push(`\nℹ️ **${t("ملاحظة:", "Note:")}** ${t("البيانات أعلاه مأخوذة من OpenStreetMap وقد لا تكون شاملة. بعض المرافق قد لا تظهر في قاعدة البيانات.", "The data above is from OpenStreetMap and may not be comprehensive. Some facilities may not appear in the database.")}`);
  }

  return parts.join("\n");
}

// ─── HELPERS ──────────────────────────────────────────────────────────

function translatePropertyType(type: string, lang: "ar" | "en"): string {
  const map: Record<string, { ar: string; en: string }> = {
    apartment: { ar: "شقة", en: "Apartment" },
    villa: { ar: "فيلا", en: "Villa" },
    house: { ar: "منزل", en: "House" },
    townhouse: { ar: "تاون هاوس", en: "Townhouse" },
    commercial: { ar: "تجاري", en: "Commercial" },
    office: { ar: "مكتب", en: "Office" },
    land: { ar: "أرض", en: "Land" },
    studio: { ar: "استوديو", en: "Studio" },
    penthouse: { ar: "بنتهاوس", en: "Penthouse" },
  };
  return map[type.toLowerCase()]?.[lang] || type;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
