/**
 * Property report generation engine.
 *
 * Architecture (global, works for ANY city/country):
 * ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
 * │   Property    │───▶│ 1. Reverse      │───▶│ 2. Collect Real  │
 * │   from DB     │    │    Geocode      │    │    Data (OSM)    │
 * └──────────────┘    │  (country/city)  │    └────────┬─────────┘
 *                     └─────────────────┘             │
 *                                                      ▼
 *                     ┌─────────────────┐    ┌──────────────────┐
 *                     │ 4. Market Price │◀───│ 3. Country-based │
 *                     │    Estimation   │    │    Providers     │
 *                     │    (per country)│    │    (global map)  │
 *                     └────────┬────────┘    └──────────────────┘
 *                              │
 *                              ▼
 *                     ┌─────────────────┐    ┌──────────────────┐
 *                     │ 5. Build Tiered  │───▶│ 6. DeepSeek V4   │
 *                     │    Prompt       │    │    Flash (JSON)  │
 *                     │ (FREE/PREMIUM)  │    └────────┬─────────┘
 *                     └─────────────────┘             │
 *                                                      ▼
 *                     ┌─────────────────┐    ┌──────────────────┐
 *                     │ 8. Return       │◀───│ 7. Validate &   │
 *                     │    Report       │    │    Fill Gaps     │
 *                     └─────────────────┘    └──────────────────┘
 *
 * Key design:
 * - Works in ANY country — detects location via Nominatim
 * - Both tiers include real market pricing (rent + sale)
 * - FREE gets basic price ranges; PREMIUM gets full analysis
 * - Phone/internet providers detected from country code
 * - Graceful fallback if DeepSeek is unavailable
 */

import { db } from "./db";
import { AIReport, FreeReport, PremiumReport } from "../endpoints/properties/ai_report_POST.schema";
import { callDeepSeek } from "./deepseek";
import {
  collectRealEstateData,
  reverseGeocode,
  searchMarketPrices,
} from "./dataCollector";
import type { MarketPriceResult } from "./dataCollector";
import { buildSystemPrompt, buildUserPrompt, ReportTier } from "./prompts";

interface ReportOptions {
  userName?: string;
  investorProfile?: string;
}

/**
 * Entry point — generates a property report.
 * Works globally for any country/city.
 */
export async function generatePropertyReport(
  propertyId: number,
  language: "ar" | "en" = "ar",
  tier: ReportTier = "free",
  options?: ReportOptions
): Promise<AIReport> {
  // 1. Fetch property from DB
  const property = await db
    .selectFrom("properties")
    .select([
      "id",
      "title",
      "description",
      "locationName",
      "latitude",
      "longitude",
      "price",
      "areaSqm",
      "bedrooms",
      "bathrooms",
      "propertyType",
      "furnished",
      "yearBuilt",
      "floorNumber",
      "amenities",
      "city",
      "district",
    ])
    .where("id", "=", propertyId)
    .executeTakeFirst();

  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  const lat = Number(property.latitude);
  const lng = Number(property.longitude);
  const price = Number(property.price);
  const areaSqm = Number(property.areaSqm);
  const pricePerSqm = areaSqm > 0 ? Math.round(price / areaSqm) : 0;

  console.log(
    `[ReportGen] 🗺️ Generating ${tier} report for property ${propertyId} ` +
    `at ${lat},${lng}`
  );

  // 2. Collect real-world data — in parallel
  const [geocode, osmData] = await Promise.all([
    reverseGeocode(lat, lng),
    collectRealEstateData(lat, lng, 3),
  ]);

  console.log(`[ReportGen] 📍 Location: ${geocode.city}, ${geocode.country} (${geocode.countryCode})`);
  console.log(`[ReportGen] 📦 OSM data: ${osmData.schools?.length || 0} schools, ${osmData.restaurants?.length || 0} restaurants`);

  const city = property.city || geocode.city || "Unknown";
  const district = property.district || geocode.district || "";
  const country = geocode.country || "";
  const countryCode = geocode.countryCode || "";

  // 3. Search market prices (country-aware)
  const marketData = await searchMarketPrices(
    lat, lng,
    property.propertyType || "apartment",
    areaSqm,
    property.bedrooms,
    city, district,
    country, countryCode,
    language
  );

  // 4. Build unified market context for BOTH tiers
  const marketContext = {
    similarRentMin: marketData.similarRentRange.min,
    similarRentMax: marketData.similarRentRange.max,
    similarRentAvg: marketData.similarRentRange.avg,
    similarSaleMin: marketData.similarSaleRange.min,
    similarSaleMax: marketData.similarSaleRange.max,
    similarSaleAvg: marketData.similarSaleRange.avg,
    currency: marketData.currency,
    currencySymbol: marketData.currencySymbol,
    country: country || countryCode || "",
    city: city,
    internetProviders: marketData.internetProviders,
    phoneProviders: marketData.phoneProviders,
  };

  // 5. Build the property info object
  const propertyInfo = {
    id: property.id,
    title: property.title || undefined,
    description: property.description || undefined,
    locationName: property.locationName,
    latitude: lat,
    longitude: lng,
    price,
    areaSqm,
    pricePerSqm,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    propertyType: property.propertyType || undefined,
    amenities: (property.amenities as string[]) || undefined,
    yearBuilt: property.yearBuilt ?? null,
    furnished: Boolean(property.furnished),
    floorNumber: property.floorNumber ?? null,
  };

  // 6. Attempt AI generation with DeepSeek
  try {
    const report = await generateWithAI(
      tier, language, propertyInfo, osmData as any, marketContext, options
    );
    console.log(`[ReportGen] ✅ ${tier} report generated for property ${propertyId}`);
    return report;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[ReportGen] ⚠️ AI failed, using fallback: ${msg}`);
    return buildFallbackReport(tier, language, propertyInfo, marketContext, osmData as any);
  }
}

// ─── AI GENERATION ──────────────────────────────────────────────────

async function generateWithAI(
  tier: ReportTier,
  language: "ar" | "en",
  propertyInfo: Record<string, any>,
  osmData: Record<string, any>,
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
  },
  options?: ReportOptions
): Promise<AIReport> {
  const systemPrompt = buildSystemPrompt(tier, language);
  const userPrompt = buildUserPrompt({
    tier,
    language,
    property: propertyInfo as any,
    osmData,
    marketContext,
    userContext: options,
  });

  console.log(`[ReportGen] 📝 Prompt ready (${language}): sys=${systemPrompt.length} user=${userPrompt.length}`);

  const rawResponse = await callDeepSeek(systemPrompt, userPrompt, {
    temperature: tier === "premium" ? 0.35 : 0.3,
    maxTokens: tier === "premium" ? 6000 : 4000,
    jsonMode: true,
  });

  let parsed: Record<string, unknown>;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (parseError) {
    console.error("[ReportGen] ❌ Failed to parse AI response as JSON");
    throw new Error("AI response was not valid JSON");
  }

  // Inject market context and area info for validation fallback
  parsed._marketContext = marketContext as any;
  parsed._areaSqm = propertyInfo.areaSqm;

  // Normalize the parsed response structure (handle AI format variations)
  normalizedResponse(parsed);

  return tier === "premium"
    ? validatePremiumReport(parsed, language)
    : validateFreeReport(parsed, language);
}

// ─── RESPONSE NORMALIZER ───────────────────────────────────────────

/**
 * Normalizes the AI response by unwrapping nested keys and mapping
 * common format variations (emojis, spaced keys, capitalized keys)
 * to the expected camelCase keys.
 */
function normalizedResponse(parsed: Record<string, unknown>): void {
  // If the AI wrapped everything under a "report" key, unwrap it
  const report = parsed.report;
  if (report && typeof report === "object" && !Array.isArray(report)) {
    const reportObj = report as Record<string, unknown>;
    // Transfer all keys from report to root, keeping existing root keys
    for (const key of Object.keys(reportObj)) {
      if (!(key in parsed) || parsed[key] === undefined) {
        parsed[key] = reportObj[key];
      }
    }
  }

  // Map common key variations to expected camelCase keys
  const keyMap: Record<string, string> = {
    "Property Summary": "propertySummary",
    "Location Overview": "locationOverview",
    "Market Prices for Similar Properties": "marketPrices",
    "Market Prices": "marketPrices",
    "Nearby Education": "nearbyEducation",
    "Healthcare Access": "healthcareAccess",
    "Shopping & Dining": "shoppingAndDining",
    "Green Spaces": "greenSpaces",
    "Transport & Connectivity": "transportAndConnectivity",
    "Internet & Phone Services": "internetAndPhone",
    "Ratings & Scores": "ratingsAndScores",
    "Positive Summary": "positiveSummary",
    "Ratings and Scores": "ratingsAndScores",
    "property_summary": "propertySummary",
    "market_prices": "marketPrices",
    "nearby_amenities": "nearbyAmenities",
    "positive_summary": "positiveSummary",
    "PropertySummary": "propertySummary",
    "MarketPrices": "marketPrices",
    "NearbyAmenities": "nearbyAmenities",
    "PositiveSummary": "positiveSummary",
  };

  for (const [oldKey, newKey] of Object.entries(keyMap)) {
    if (oldKey in parsed && newKey !== oldKey) {
      if (!(newKey in parsed) || parsed[newKey] === undefined) {
        parsed[newKey] = parsed[oldKey];
      }
      delete parsed[oldKey];
    }
  }

  // If propertySummary is a string (text section), split into headline + description
  if (typeof parsed.propertySummary === "string") {
    const text = parsed.propertySummary as string;
    parsed.propertySummary = {
      positiveHeadline: text.substring(0, 120),
      locationDescription: text,
    };
  }

  // If positiveSummary was placed at root, it's already handled.
  // If only text sections exist, try to populate structured fields from them
  if (typeof parsed.positiveSummary !== "string") {
    const psStr = parsed.ratingsAndScores || parsed["Positive Summary"] || "";
    if (typeof psStr === "string") {
      parsed.positiveSummary = psStr;
    }
  }

  // Extract scores from text if not provided as structured data
  if (typeof parsed.scores !== "object" || parsed.scores === null) {
    const scoresText = typeof parsed.ratingsAndScores === "string"
      ? parsed.ratingsAndScores as string
      : typeof parsed["⭐ Ratings & Scores"] === "string"
        ? parsed["⭐ Ratings & Scores"] as string
        : "";
    if (scoresText) {
      parsed.scores = extractScoresFromText(scoresText);
    }
  }

  // Ensure scores exists as an object
  if (typeof parsed.scores !== "object" || parsed.scores === null) {
    parsed.scores = {};
  }

  // Ensure marketPrices exists (will fall back to _marketContext)
  if (typeof parsed.marketPrices !== "object" || parsed.marketPrices === null) {
    parsed.marketPrices = {};
  }

  // Ensure propertySummary exists
  if (typeof parsed.propertySummary !== "object" || parsed.propertySummary === null) {
    parsed.propertySummary = { positiveHeadline: "", locationDescription: "" };
  }

  // Ensure nearbyAmenities exists
  if (typeof parsed.nearbyAmenities !== "object" || parsed.nearbyAmenities === null) {
    parsed.nearbyAmenities = {};
  }
}

/**
 * Extract numerical scores from AI-generated text descriptions.
 */
function extractScoresFromText(text: string): Record<string, number> {
  const scores: Record<string, number> = {};
  const patterns = [
    [/Safety.*?(\d+)[\/\s]*10/i, "safetyRating"],
    [/Walkability.*?(\d+)[\/\s]*10/i, "walkabilityScore"],
    [/Noise.*?(\d+)[\/\s]*10/i, "noiseLevel"],
    [/Air Quality.*?(\d+)/i, "airQualityIndex"],
    [/Quality of Life.*?(\d+)[\/\s]*10/i, "qualityOfLifeScore"],
    [/Services.*?(\d+)[\/\s]*10/i, "qualityOfLifeScore"],
  ];
  for (const [regex, key] of patterns) {
    const match = text.match(regex);
    if (match) {
      scores[key] = Math.max(1, Math.min(10, parseInt(match[1], 10)));
    }
  }
  return scores;
}

// ─── VALIDATION (Free Report) ──────────────────────────────────────

function validateFreeReport(
  parsed: Record<string, unknown>,
  language: "ar" | "en"
): FreeReport {
  const toStr = (v: unknown, fb: string): string =>
    typeof v === "string" && v.length > 0 ? v : fb;

  const toNum = (v: unknown, fb: number): number => {
    const n = Number(v);
    return isNaN(n) ? fb : n;
  };

  const clampScore = (v: unknown, fb: number): number =>
    Math.max(1, Math.min(10, Math.round(toNum(v, fb))));

  const safeStringArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const safePOIArr = (v: unknown, keys: string[]): any[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is Record<string, unknown> =>
        typeof x === "object" && x !== null && !Array.isArray(x))
      .map((x) => {
        const obj: Record<string, unknown> = {};
        for (const k of keys) obj[k] = x[k];
        obj.name = typeof x.name === "string" ? x.name : "—";
        obj.distanceKm = toNum(x.distanceKm, 1);
        return obj;
      });
  };

  const getObj = (parent: Record<string, unknown>, key: string): Record<string, unknown> =>
    typeof parent[key] === "object" && parent[key] !== null
      ? parent[key] as Record<string, unknown>
      : {};

  // Pull market context that was injected during AI generation
  const mc = getObj(parsed, "_marketContext");

  // Try to extract marketPrices from AI or use context fallback
  const mp = getObj(parsed, "marketPrices");
  const rentRange = getObj(mp, "similarRentRange");
  const saleRange = getObj(mp, "similarSaleRange");

  const ps = getObj(parsed, "propertySummary");
  const am = getObj(parsed, "nearbyAmenities");
  const sd = getObj(am, "shoppingDining");
  const tr = getObj(am, "transportation");
  const ess = getObj(am, "essentialServices");
  const ent = getObj(am, "entertainmentSports");
  const conn = getObj(parsed, "connectivity");
  const scores = getObj(parsed, "scores");

  return {
    reportType: "free",
    language,
    propertySummary: {
      positiveHeadline: toStr(ps.positiveHeadline || parsed.positiveHeadline, ""),
      locationDescription: toStr(ps.locationDescription, ""),
    },
    marketPrices: {
      currency: toStr(mp.currency || mc.currency, "USD"),
      currencySymbol: toStr(mp.currencySymbol || mc.currencySymbol, "$"),
      similarRentRange: {
        min: toNum(rentRange.min || mc.similarRentMin, 0),
        max: toNum(rentRange.max || mc.similarRentMax, 0),
        avg: toNum(rentRange.avg || mc.similarRentAvg, 0),
      },
      similarSaleRange: {
        min: toNum(saleRange.min || mc.similarSaleMin, 0),
        max: toNum(saleRange.max || mc.similarSaleMax, 0),
        avg: toNum(saleRange.avg || mc.similarSaleAvg, 0),
      },
    },
    nearbyAmenities: {
      education: safePOIArr(am.education, ["name", "type", "distanceKm"]),
      healthcare: safePOIArr(am.healthcare, ["name", "type", "distanceKm"]),
      shoppingDining: {
        malls: safePOIArr(sd.malls, ["name", "distanceKm"]),
        restaurants: toNum(sd.restaurants, 0),
        restaurantNames: safeStringArr(sd.restaurantNames),
      },
      parksRecreation: safePOIArr(am.parksRecreation, ["name", "distanceKm"]),
      transportation: {
        metroStations: safePOIArr(tr.metroStations, ["name", "distanceKm"]),
        busStops: safePOIArr(tr.busStops, ["name", "distanceKm"]),
        majorRoads: safePOIArr(tr.majorRoads, ["name", "distanceKm"]),
      },
      essentialServices: {
        banks: safePOIArr(ess.banks, ["name", "distanceKm"]),
        mosques: safePOIArr(ess.mosques, ["name", "distanceKm"]),
        petrolStations: safePOIArr(ess.petrolStations, ["name", "distanceKm"]),
        policeStations: safePOIArr(ess.policeStations, ["name", "distanceKm"]),
        governmentOffices: safePOIArr(ess.governmentOffices, ["name", "distanceKm"]),
      },
      entertainmentSports: {
        cinemas: safePOIArr(ent.cinemas, ["name", "distanceKm"]),
        sportsFacilities: safePOIArr(ent.sportsFacilities, ["name", "distanceKm"]),
        hotels: safePOIArr(ent.hotels, ["name", "distanceKm"]),
      },
    },
    connectivity: {
      internetProviders: safeStringArr(conn.internetProviders).length > 0
        ? safeStringArr(conn.internetProviders)
        : safeStringArr(mc.internetProviders),
      phoneProviders: safeStringArr(conn.phoneProviders).length > 0
        ? safeStringArr(conn.phoneProviders)
        : safeStringArr(mc.phoneProviders),
    },
    scores: {
      safetyRating: clampScore(scores.safetyRating, 7),
      walkabilityScore: clampScore(scores.walkabilityScore, 6),
      noiseLevel: clampScore(scores.noiseLevel, 4),
      airQualityIndex: Math.max(0, Math.round(toNum(scores.airQualityIndex, 60))),
      qualityOfLifeScore: clampScore(scores.qualityOfLifeScore, 7),
    },
    trafficConditions: toStr(parsed.trafficConditions, ""),
    climateNotes: toStr(parsed.climateNotes, ""),
    areaDescription: toStr(parsed.areaDescription, ""),
    positiveSummary: toStr(parsed.positiveSummary, ""),
  };
}

// ─── VALIDATION (Premium Report) ───────────────────────────────────

function validatePremiumReport(
  parsed: Record<string, unknown>,
  language: "ar" | "en"
): PremiumReport {
  // Same helper functions
  const toStr = (v: unknown, fb: string): string =>
    typeof v === "string" && v.length > 0 ? v : fb;
  const toNum = (v: unknown, fb: number): number =>
    isNaN(Number(v)) ? fb : Number(v);
  const clampScore = (v: unknown, fb: number): number =>
    Math.max(1, Math.min(10, Math.round(toNum(v, fb))));
  const safeStringArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const safePOIArr = (v: unknown, keys: string[]): any[] => {
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is Record<string, unknown> =>
      typeof x === "object" && x !== null && !Array.isArray(x)
    ).map((x) => {
      const obj: Record<string, unknown> = {};
      for (const k of keys) obj[k] = x[k];
      obj.name = typeof x.name === "string" ? x.name : "—";
      obj.distanceKm = toNum(x.distanceKm, 1);
      return obj;
    });
  };

  const getObj = (parent: Record<string, unknown>, key: string): Record<string, unknown> =>
    typeof parent[key] === "object" && parent[key] !== null
      ? parent[key] as Record<string, unknown>
      : {};

  const mc = getObj(parsed, "_marketContext");

  const ps = getObj(parsed, "propertySummary");
  const am = getObj(parsed, "nearbyAmenities");
  const sd = getObj(am, "shoppingDining");
  const tr = getObj(am, "transportation");
  const ess = getObj(am, "essentialServices");
  const ent = getObj(am, "entertainmentSports");
  const conn = getObj(am, "connectivity");
  const qol = getObj(parsed, "qualityOfLifeIndicators");
  const radar = getObj(parsed, "scoresRadar");
  const ma = getObj(parsed, "marketAnalysis");
  const ia = getObj(parsed, "investmentAnalysis");
  const dp = getObj(parsed, "developmentPipeline");
  const ndd = getObj(parsed, "neighborhoodDeepDive");
  const ra = getObj(parsed, "riskAssessment");
  const sr = getObj(parsed, "strategicRecommendations");

  const rentRange = getObj(ma, "similarPropertiesRentRange");
  const saleRange = getObj(ma, "similarPropertiesSaleRange");

  return {
    reportType: "premium",
    language,
    investmentGrade: toStr(parsed.investmentGrade, "B"),
    executiveSummary: toStr(parsed.executiveSummary, ""),
    propertySummary: {
      positiveHeadline: toStr(ps.positiveHeadline, ""),
      locationDescription: toStr(ps.locationDescription, ""),
      uniqueSellingPoints: safeStringArr(ps.uniqueSellingPoints),
    },
    nearbyAmenities: {
      education: safePOIArr(am.education, ["name", "type", "distanceKm"]),
      healthcare: safePOIArr(am.healthcare, ["name", "type", "distanceKm"]),
      shoppingDining: {
        malls: safePOIArr(sd.malls, ["name", "distanceKm", "anchorStores"]),
        supermarkets: safePOIArr(sd.supermarkets, ["name", "distanceKm"]),
        restaurants: toNum(sd.restaurants, 0),
        restaurantNames: safeStringArr(sd.restaurantNames),
        cafes: toNum(sd.cafes, 0),
        cafeNames: safeStringArr(sd.cafeNames),
      },
      parksRecreation: safePOIArr(am.parksRecreation, ["name", "type", "distanceKm"]),
      transportation: {
        metroStations: safePOIArr(tr.metroStations, ["name", "distanceKm", "line"]),
        busStops: safePOIArr(tr.busStops, ["name", "distanceKm"]),
        majorRoads: safePOIArr(tr.majorRoads, ["name", "type", "distanceKm"]),
        airportDistanceKm: toNum(tr.airportDistanceKm, undefined),
      },
      essentialServices: {
        banks: safePOIArr(ess.banks, ["name", "distanceKm"]),
        mosques: safePOIArr(ess.mosques, ["name", "distanceKm"]),
        petrolStations: safePOIArr(ess.petrolStations, ["name", "distanceKm"]),
        policeStations: safePOIArr(ess.policeStations, ["name", "distanceKm"]),
        governmentOffices: safePOIArr(ess.governmentOffices, ["name", "distanceKm"]),
        hotels: safePOIArr(ess.hotels, ["name", "distanceKm", "stars"]),
      },
      entertainmentSports: {
        cinemas: safePOIArr(ent.cinemas, ["name", "distanceKm"]),
        sportsFacilities: safePOIArr(ent.sportsFacilities, ["name", "type", "distanceKm"]),
      },
      connectivity: {
        internetProviders: safeStringArr(conn.internetProviders).length > 0
          ? safeStringArr(conn.internetProviders)
          : safeStringArr(mc.internetProviders),
        phoneProviders: safeStringArr(conn.phoneProviders).length > 0
          ? safeStringArr(conn.phoneProviders)
          : safeStringArr(mc.phoneProviders),
        fiberAvailable: conn.fiberAvailable === true,
      },
    },
    qualityOfLifeIndicators: {
      safetyRating: clampScore(qol.safetyRating, 7),
      walkabilityScore: clampScore(qol.walkabilityScore, 6),
      noiseLevel: clampScore(qol.noiseLevel, 4),
      airQualityIndex: Math.max(0, Math.round(toNum(qol.airQualityIndex, 60))),
      qualityOfLifeScore: clampScore(qol.qualityOfLifeScore, 7),
      trafficConditions: toStr(qol.trafficConditions, ""),
      climateNotes: toStr(qol.climateNotes, ""),
    },
    scoresRadar: {
      investmentPotential: clampScore(radar.investmentPotential, 6),
      locationQuality: clampScore(radar.locationQuality, 7),
      infrastructure: clampScore(radar.infrastructure, 7),
      communityVibe: clampScore(radar.communityVibe, 6),
      growthProspect: clampScore(radar.growthProspect, 6),
      accessibility: clampScore(radar.accessibility, 7),
      valueForMoney: clampScore(radar.valueForMoney, 6),
    },
    marketAnalysis: {
      currentPrice: toNum(ma.currentPrice, 0),
      pricePerSqm: toNum(ma.pricePerSqm, 0),
      areaAvgPricePerSqm: toNum(ma.areaAvgPricePerSqm, toNum(mc.similarSaleAvg, 0) / toNum(parsed._areaSqm, 100) || 0),
      priceComparisonStatus: toStr(ma.priceComparisonStatus, ""),
      priceDifferencePercent: toNum(ma.priceDifferencePercent, 0),
      similarPropertiesRentRange: {
        min: toNum(rentRange.min || mc.similarRentMin, 0),
        max: toNum(rentRange.max || mc.similarRentMax, 0),
        avg: toNum(rentRange.avg || mc.similarRentAvg, 0),
      },
      similarPropertiesSaleRange: {
        min: toNum(saleRange.min || mc.similarSaleMin, 0),
        max: toNum(saleRange.max || mc.similarSaleMax, 0),
        avg: toNum(saleRange.avg || mc.similarSaleAvg, 0),
      },
      rentalYieldEstimate: toNum(ma.rentalYieldEstimate, 0),
      marketTrend: toStr(ma.marketTrend, ""),
      priceAppreciationForecast: toStr(ma.priceAppreciationForecast, ""),
    },
    investmentAnalysis: {
      roiProjection5Years: toStr(ia.roiProjection5Years, ""),
      breakEvenPoint: toStr(ia.breakEvenPoint, ""),
      incomePotential: toStr(ia.incomePotential, ""),
      capitalGrowthPotential: toStr(ia.capitalGrowthPotential, ""),
      riskLevel: toStr(ia.riskLevel, "Medium"),
      investmentHorizon: toStr(ia.investmentHorizon, ""),
    },
    developmentPipeline: {
      currentDevelopments: safeStringArr(dp.currentDevelopments),
      plannedDevelopments: safeStringArr(dp.plannedDevelopments),
      impactOnValue: toStr(dp.impactOnValue, ""),
    },
    neighborhoodDeepDive: {
      demographics: toStr(ndd.demographics, ""),
      communityVibe: toStr(ndd.communityVibe, ""),
      futureOutlook: toStr(ndd.futureOutlook, ""),
      comparableNeighborhoods: safeStringArr(ndd.comparableNeighborhoods),
    },
    riskAssessment: {
      overallRisk: toStr(ra.overallRisk, "Medium"),
      marketRisk: toStr(ra.marketRisk, ""),
      locationRisk: toStr(ra.locationRisk, ""),
      liquidityRisk: toStr(ra.liquidityRisk, ""),
      riskMitigationTips: safeStringArr(ra.riskMitigationTips),
    },
    strategicRecommendations: {
      forBuyer: safeStringArr(sr.forBuyer),
      forInvestor: safeStringArr(sr.forInvestor),
      negotiationTips: safeStringArr(sr.negotiationTips),
    },
    areaAnalysis: toStr(parsed.areaAnalysis, ""),
    positiveSummary: toStr(parsed.positiveSummary, ""),
  };
}

// ─── FALLBACK REPORTS ──────────────────────────────────────────────

function buildFallbackReport(
  tier: ReportTier,
  language: "ar" | "en",
  property: Record<string, any>,
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
  },
  osmData: Record<string, any>
): AIReport {
  if (tier === "premium") {
    return buildFallbackPremium(language, property, marketContext, osmData);
  }
  return buildFallbackFree(language, property, marketContext, osmData);
}

function buildFallbackFree(
  language: "ar" | "en",
  property: Record<string, any>,
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
  },
  osmData: Record<string, any>
): FreeReport {
  const na = "—";

  const getName = (arr: any[] | undefined, idx: number = 0): string | undefined =>
    arr?.[idx]?.name || arr?.[idx]?.tags?.name || arr?.[idx]?.tags?.["name:en"] || arr?.[idx]?.tags?.["name:ar"];
  const getDist = (arr: any[] | undefined, idx: number = 0): number =>
    arr?.[idx]?.distanceKm ?? Math.round((0.5 + idx * 0.3) * 10) / 10;

  const buildPOI = (arr: any[] | undefined, max: number) => {
    const items: { name: string; distanceKm: number }[] = [];
    for (let i = 0; i < max; i++) {
      const name = getName(arr, i);
      if (!name) break;
      items.push({ name, distanceKm: getDist(arr, i) });
    }
    return items;
  };
  const buildTypedPOI = (arr: any[] | undefined, max: number, type: string) => {
    const items: { name: string; type: string; distanceKm: number }[] = [];
    for (let i = 0; i < max; i++) {
      const name = getName(arr, i);
      if (!name) break;
      items.push({ name, type, distanceKm: getDist(arr, i) });
    }
    return items;
  };

  const schools = osmData.schools || [];
  const hospitals = osmData.hospitals || [];
  const restaurants = osmData.restaurants || [];
  const parks = osmData.parks || [];
  const malls = osmData.malls || [];
  const banks = osmData.banks || [];
  const mosques = osmData.mosques || [];
  const petrol = osmData.petrolStations || [];
  const police = osmData.policeStations || [];
  const gov = osmData.governmentOffices || [];
  const metro = osmData.metroStations || [];
  const bus = osmData.busStops || [];
  const roads = osmData.majorRoads || [];
  const cinemas = osmData.cinemas || [];
  const sports = osmData.sportsFacilities || [];
  const hotels = osmData.hotels || [];

  const restaurantNames = restaurants.slice(0, 10).map((r: any) =>
    r.name || r.tags?.name || ""
  ).filter(Boolean);

  return {
    reportType: "free",
    language,
    propertySummary: {
      positiveHeadline: property.locationName,
      locationDescription:
        language === "ar"
          ? `عقار في ${property.locationName}${marketContext.country ? `، ${marketContext.country}` : ""} بمساحة ${property.areaSqm}م² بسعر ${property.price.toLocaleString()} ${marketContext.currencySymbol}`
          : `Property in ${property.locationName}${marketContext.country ? `, ${marketContext.country}` : ""}, ${property.areaSqm}m² at ${property.price.toLocaleString()} ${marketContext.currencySymbol}`,
    },
    marketPrices: {
      currency: marketContext.currency,
      currencySymbol: marketContext.currencySymbol,
      similarRentRange: {
        min: marketContext.similarRentMin,
        max: marketContext.similarRentMax,
        avg: marketContext.similarRentAvg,
      },
      similarSaleRange: {
        min: marketContext.similarSaleMin,
        max: marketContext.similarSaleMax,
        avg: marketContext.similarSaleAvg,
      },
    },
    nearbyAmenities: {
      education: buildTypedPOI(schools, 5, "School"),
      healthcare: buildTypedPOI(hospitals, 3, "Hospital"),
      shoppingDining: {
        malls: buildPOI(malls, 3),
        restaurants: restaurants.length,
        restaurantNames,
      },
      parksRecreation: buildPOI(parks, 5),
      transportation: {
        metroStations: buildPOI(metro, 3),
        busStops: buildPOI(bus, 5),
        majorRoads: buildPOI(roads, 5),
      },
      essentialServices: {
        banks: buildPOI(banks, 3),
        mosques: buildPOI(mosques, 5),
        petrolStations: buildPOI(petrol, 3),
        policeStations: buildPOI(police, 2),
        governmentOffices: buildPOI(gov, 3),
      },
      entertainmentSports: {
        cinemas: buildPOI(cinemas, 3),
        sportsFacilities: buildPOI(sports, 3),
        hotels: buildPOI(hotels, 3),
      },
    },
    connectivity: {
      internetProviders: marketContext.internetProviders,
      phoneProviders: marketContext.phoneProviders,
    },
    scores: {
      safetyRating: 7,
      walkabilityScore: 6,
      noiseLevel: 4,
      airQualityIndex: 60,
      qualityOfLifeScore: 7,
    },
    trafficConditions: language === "ar" ? "متوسطة" : "Moderate",
    climateNotes:
      language === "ar"
        ? `مناخ المنطقة يتبع النمط المناخي المعتاد في ${marketContext.country || "هذه المنطقة"}.`
        : `Regional climate patterns for ${marketContext.country || "this area"}.`,
    areaDescription:
      language === "ar"
        ? `الحي يحتوي على ${restaurants.length} مطعم، ${parks.length} حديقة، ${schools.length} مدرسة. نطاق الإيجار: ${marketContext.similarRentMin.toLocaleString()}-${marketContext.similarRentMax.toLocaleString()} ${marketContext.currencySymbol}/شهرياً.`
        : `Area features ${restaurants.length} restaurants, ${parks.length} parks, ${schools.length} schools. Rent range: ${marketContext.similarRentMin.toLocaleString()}-${marketContext.similarRentMax.toLocaleString()} ${marketContext.currencySymbol}/month.`,
    positiveSummary:
      language === "ar"
        ? `تقرير يعتمد على بيانات حقيقية من OpenStreetMap وأسعار السوق. العقار في ${property.locationName}${marketContext.country ? `، ${marketContext.country}` : ""}.`
        : `Report based on real data from OpenStreetMap and market prices. Property in ${property.locationName}${marketContext.country ? `, ${marketContext.country}` : ""}.`,
  };
}

function buildFallbackPremium(
  language: "ar" | "en",
  property: Record<string, any>,
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
  },
  osmData: Record<string, any>
): PremiumReport {
  const fb = buildFallbackFree(language, property, marketContext, osmData);

  return {
    reportType: "premium",
    language,
    investmentGrade: "B",
    executiveSummary:
      language === "ar"
        ? `تقرير ذكاء عقاري ممتاز للعقار في ${property.locationName}${marketContext.country ? `، ${marketContext.country}` : ""}. يعتمد على بيانات حقيقية وأسعار السوق.`
        : `Premium real estate intelligence report for ${property.locationName}${marketContext.country ? `, ${marketContext.country}` : ""}. Based on real OSM and market data.`,
    propertySummary: {
      positiveHeadline: fb.propertySummary.positiveHeadline,
      locationDescription: fb.propertySummary.locationDescription,
      uniqueSellingPoints: [
        language === "ar"
          ? `بيانات حقيقية: ${fb.nearbyAmenities.shoppingDining.restaurants} مطعم، ${fb.nearbyAmenities.parksRecreation.length} حديقة، نطاق إيجار ${marketContext.similarRentAvg.toLocaleString()} ${marketContext.currencySymbol}`
          : `Real data: ${fb.nearbyAmenities.shoppingDining.restaurants} restaurants, ${fb.nearbyAmenities.parksRecreation.length} parks, avg rent ${marketContext.similarRentAvg.toLocaleString()} ${marketContext.currencySymbol}`,
      ],
    },
    nearbyAmenities: {
      education: fb.nearbyAmenities.education.map((e: any) => ({ ...e, type: e.type || "School" })),
      healthcare: fb.nearbyAmenities.healthcare.map((h: any) => ({ ...h, type: h.type || "Hospital" })),
      shoppingDining: {
        malls: fb.nearbyAmenities.shoppingDining.malls,
        supermarkets: [],
        restaurants: fb.nearbyAmenities.shoppingDining.restaurants,
        restaurantNames: fb.nearbyAmenities.shoppingDining.restaurantNames,
        cafes: 0,
        cafeNames: [],
      },
      parksRecreation: fb.nearbyAmenities.parksRecreation.map((p: any) => ({ ...p, type: "Park" })),
      transportation: {
        metroStations: fb.nearbyAmenities.transportation.metroStations,
        busStops: fb.nearbyAmenities.transportation.busStops,
        majorRoads: fb.nearbyAmenities.transportation.majorRoads.map((r: any) => ({ ...r, type: "Main Road" })),
      },
      essentialServices: {
        banks: fb.nearbyAmenities.essentialServices.banks,
        mosques: fb.nearbyAmenities.essentialServices.mosques,
        petrolStations: fb.nearbyAmenities.essentialServices.petrolStations,
        policeStations: fb.nearbyAmenities.essentialServices.policeStations,
        governmentOffices: fb.nearbyAmenities.essentialServices.governmentOffices,
        hotels: fb.nearbyAmenities.entertainmentSports.hotels.map((h: any) => ({ ...h, stars: 3 })),
      },
      entertainmentSports: {
        cinemas: fb.nearbyAmenities.entertainmentSports.cinemas,
        sportsFacilities: fb.nearbyAmenities.entertainmentSports.sportsFacilities.map((s: any) => ({ ...s, type: "Sports Facility" })),
      },
      connectivity: {
        internetProviders: fb.connectivity.internetProviders,
        phoneProviders: fb.connectivity.phoneProviders,
        fiberAvailable: true,
      },
    },
    qualityOfLifeIndicators: {
      safetyRating: fb.scores.safetyRating,
      walkabilityScore: fb.scores.walkabilityScore,
      noiseLevel: fb.scores.noiseLevel,
      airQualityIndex: fb.scores.airQualityIndex,
      qualityOfLifeScore: fb.scores.qualityOfLifeScore,
      trafficConditions: fb.trafficConditions,
      climateNotes: fb.climateNotes,
    },
    scoresRadar: {
      investmentPotential: 6,
      locationQuality: 7,
      infrastructure: 7,
      communityVibe: 6,
      growthProspect: 6,
      accessibility: 7,
      valueForMoney: 6,
    },
    marketAnalysis: {
      currentPrice: property.price,
      pricePerSqm: property.pricePerSqm,
      areaAvgPricePerSqm: Math.round(marketContext.similarSaleAvg / (property.areaSqm || 1)),
      priceComparisonStatus:
        language === "ar" ? "في السوق" : "At Market",
      priceDifferencePercent: property.pricePerSqm > 0
        ? Math.round(((property.pricePerSqm - marketContext.similarSaleAvg / (property.areaSqm || 1)) / property.pricePerSqm) * 100)
        : 0,
      similarPropertiesRentRange: {
        min: marketContext.similarRentMin,
        max: marketContext.similarRentMax,
        avg: marketContext.similarRentAvg,
      },
      similarPropertiesSaleRange: {
        min: marketContext.similarSaleMin,
        max: marketContext.similarSaleMax,
        avg: marketContext.similarSaleAvg,
      },
      rentalYieldEstimate: 5,
      marketTrend: "Stable",
      priceAppreciationForecast:
        language === "ar" ? "متوقع استقرار السوق" : "Market stability expected",
    },
    investmentAnalysis: {
      roiProjection5Years:
        language === "ar"
          ? `عائد استثماري معتدل خلال 5 سنوات في ${marketContext.city || "هذه المنطقة"}`
          : `Moderate ROI expected over 5 years in ${marketContext.city || "this area"}`,
      breakEvenPoint:
        language === "ar" ? "قيد التحليل (يتطلب بيانات سوقية إضافية)" : "Under analysis (requires additional market data)",
      incomePotential:
        language === "ar"
          ? `معدل العائد الإيجاري التقديري: ${marketContext.similarRentAvg.toLocaleString()} ${marketContext.currencySymbol}/شهرياً`
          : `Estimated rental income: ${marketContext.similarRentAvg.toLocaleString()} ${marketContext.currencySymbol}/month`,
      capitalGrowthPotential:
        language === "ar" ? `نمو متوقع حسب متوسطات ${marketContext.country || "السوق"}` : `Growth expected per ${marketContext.country || "market"} averages`,
      riskLevel: "Medium",
      investmentHorizon: "Medium-term (3-5 years)",
    },
    developmentPipeline: {
      currentDevelopments: [],
      plannedDevelopments: [],
      impactOnValue:
        language === "ar" ? "غير متوفرة" : "Not available",
    },
    neighborhoodDeepDive: {
      demographics:
        language === "ar"
          ? `تحليل ديموغرافي عام لمنطقة ${property.locationName}، ${marketContext.country || ""}`
          : `General demographic analysis for ${property.locationName}${marketContext.country ? `, ${marketContext.country}` : ""}`,
      communityVibe:
        language === "ar" ? `أجواء المجتمع في ${marketContext.city || property.locationName}` : `Community atmosphere in ${marketContext.city || property.locationName}`,
      futureOutlook:
        language === "ar" ? `النظرة المستقبلية لسوق ${marketContext.country || "العقارات"}` : `Future outlook for ${marketContext.country || "property"} market`,
      comparableNeighborhoods: [],
    },
    riskAssessment: {
      overallRisk: "Medium",
      marketRisk: "Medium",
      locationRisk: "Low",
      liquidityRisk: "Medium",
      riskMitigationTips: [
        language === "ar" ? "قارن مع عقارات مماثلة في المنطقة" : "Compare with similar properties in the area",
        language === "ar" ? `راجع متوسطات الأسعار في ${marketContext.city || "المدينة"}` : `Review price averages in ${marketContext.city || "the city"}`,
      ],
    },
    strategicRecommendations: {
      forBuyer: [
        language === "ar"
          ? `زيارة العقار والتجول في ${marketContext.neighborhood || "الحي"}`
          : `Visit the property and walk around ${marketContext.neighborhood || "the neighborhood"}`,
      ],
      forInvestor: [
        language === "ar"
          ? `دراسة الطلب على الإيجار في ${marketContext.city || "المدينة"}`
          : `Study rental demand in ${marketContext.city || "the city"}`,
      ],
      negotiationTips: [
        language === "ar"
          ? `قارن مع متوسط سعر البيع في المنطقة (${marketContext.similarSaleAvg.toLocaleString()} ${marketContext.currencySymbol})`
          : `Compare with the average sale price in the area (${marketContext.similarSaleAvg.toLocaleString()} ${marketContext.currencySymbol})`,
      ],
    },
    areaAnalysis: fb.areaDescription,
    positiveSummary:
      language === "ar"
        ? `تقرير ذكاء عقاري ممتاز. العقار في ${property.locationName} محاط بـ ${fb.nearbyAmenities.shoppingDining.restaurants} مطعم و ${fb.nearbyAmenities.parksRecreation.length} حديقة. متوسط الإيجار: ${marketContext.similarRentAvg.toLocaleString()} ${marketContext.currencySymbol}/شهر.`
        : `Premium real estate intelligence. Property in ${property.locationName} has ${fb.nearbyAmenities.shoppingDining.restaurants} restaurants, ${fb.nearbyAmenities.parksRecreation.length} parks. Avg rent: ${marketContext.similarRentAvg.toLocaleString()} ${marketContext.currencySymbol}/month.`,
  };
}
