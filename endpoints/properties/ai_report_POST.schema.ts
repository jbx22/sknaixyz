import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  propertyId: z.number(),
  language: z.enum(["ar", "en"]).optional().default("ar"),
  tier: z.enum(["free", "premium"]).optional().default("free"),
});

export type InputType = z.infer<typeof schema>;

// ─── FREE TIER REPORT TYPE ────────────────────────────────────────

export type FreeReport = {
  reportType: "free";
  language: "ar" | "en";
  propertySummary: {
    positiveHeadline: string;
    locationDescription: string;
  };
  nearbyAmenities: {
    education: { name: string; type: string; distanceKm: number }[];
    healthcare: { name: string; type: string; distanceKm: number }[];
    shoppingDining: {
      malls: { name: string; distanceKm: number }[];
      restaurants: number;
      restaurantNames: string[];
    };
    parksRecreation: { name: string; distanceKm: number }[];
    transportation: {
      metroStations: { name: string; distanceKm: number }[];
      busStops: { name: string; distanceKm: number }[];
      majorRoads: { name: string; distanceKm: number }[];
    };
    essentialServices: {
      banks: { name: string; distanceKm: number }[];
      mosques: { name: string; distanceKm: number }[];
      petrolStations: { name: string; distanceKm: number }[];
      policeStations: { name: string; distanceKm: number }[];
      governmentOffices: { name: string; distanceKm: number }[];
    };
    entertainmentSports: {
      cinemas: { name: string; distanceKm: number }[];
      sportsFacilities: { name: string; distanceKm: number }[];
      hotels: { name: string; distanceKm: number }[];
    };
  };
  marketPrices: {
    currency: string;
    currencySymbol: string;
    similarRentRange: { min: number; max: number; avg: number };
    similarSaleRange: { min: number; max: number; avg: number };
  };
  connectivity: {
    internetProviders: string[];
    phoneProviders: string[];
  };
  scores: {
    safetyRating: number;
    walkabilityScore: number;
    noiseLevel: number;
    airQualityIndex: number;
    qualityOfLifeScore: number;
  };
  trafficConditions: string;
  climateNotes: string;
  areaDescription: string;
  positiveSummary: string;
};

// ─── PREMIUM TIER REPORT TYPE ─────────────────────────────────────

export type PremiumReport = {
  reportType: "premium";
  language: "ar" | "en";
  investmentGrade: string;
  executiveSummary: string;
  propertySummary: {
    positiveHeadline: string;
    locationDescription: string;
    uniqueSellingPoints: string[];
  };
  nearbyAmenities: {
    education: { name: string; type: string; distanceKm: number }[];
    healthcare: { name: string; type: string; distanceKm: number }[];
    shoppingDining: {
      malls: { name: string; distanceKm: number; anchorStores?: string }[];
      supermarkets: { name: string; distanceKm: number }[];
      restaurants: number;
      restaurantNames: string[];
      cafes: number;
      cafeNames: string[];
    };
    parksRecreation: { name: string; type: string; distanceKm: number }[];
    transportation: {
      metroStations: { name: string; distanceKm: number; line?: string }[];
      busStops: { name: string; distanceKm: number }[];
      majorRoads: { name: string; type: string; distanceKm: number }[];
      airportDistanceKm?: number;
    };
    essentialServices: {
      banks: { name: string; distanceKm: number }[];
      mosques: { name: string; distanceKm: number }[];
      petrolStations: { name: string; distanceKm: number }[];
      policeStations: { name: string; distanceKm: number }[];
      governmentOffices: { name: string; distanceKm: number }[];
      hotels: { name: string; distanceKm: number; stars?: number }[];
    };
    entertainmentSports: {
      cinemas: { name: string; distanceKm: number }[];
      sportsFacilities: { name: string; type: string; distanceKm: number }[];
    };
    connectivity: {
      internetProviders: string[];
      phoneProviders: string[];
      fiberAvailable: boolean;
    };
  };
  qualityOfLifeIndicators: {
    safetyRating: number;
    walkabilityScore: number;
    noiseLevel: number;
    airQualityIndex: number;
    qualityOfLifeScore: number;
    trafficConditions: string;
    climateNotes: string;
  };
  scoresRadar: {
    investmentPotential: number;
    locationQuality: number;
    infrastructure: number;
    communityVibe: number;
    growthProspect: number;
    accessibility: number;
    valueForMoney: number;
  };
  marketAnalysis: {
    currentPrice: number;
    pricePerSqm: number;
    areaAvgPricePerSqm: number;
    priceComparisonStatus: string;
    priceDifferencePercent: number;
    similarPropertiesRentRange: { min: number; max: number; avg: number };
    similarPropertiesSaleRange: { min: number; max: number; avg: number };
    rentalYieldEstimate: number;
    marketTrend: string;
    priceAppreciationForecast: string;
  };
  investmentAnalysis: {
    roiProjection5Years: string;
    breakEvenPoint: string;
    incomePotential: string;
    capitalGrowthPotential: string;
    riskLevel: string;
    investmentHorizon: string;
  };
  developmentPipeline: {
    currentDevelopments: string[];
    plannedDevelopments: string[];
    impactOnValue: string;
  };
  neighborhoodDeepDive: {
    demographics: string;
    communityVibe: string;
    futureOutlook: string;
    comparableNeighborhoods: string[];
  };
  riskAssessment: {
    overallRisk: string;
    marketRisk: string;
    locationRisk: string;
    liquidityRisk: string;
    riskMitigationTips: string[];
  };
  strategicRecommendations: {
    forBuyer: string[];
    forInvestor: string[];
    negotiationTips: string[];
  };
  areaAnalysis: string;
  positiveSummary: string;
};

// ─── UNION TYPE ───────────────────────────────────────────────────

export type AIReport = FreeReport | PremiumReport;

// ─── RESPONSE TYPE ────────────────────────────────────────────────

export type OutputType = {
  report: AIReport;
  tier: "free" | "premium";
};

export const generateAIReport = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/properties/ai_report`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
