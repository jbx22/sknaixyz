import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  propertyId: z.number(),
  language: z.enum(['ar', 'en']).optional(),
});

export type InputType = z.infer<typeof schema>;

export type AIReport = {
  internetProviders: string[];
  nearestSchools: { name: string; type: string; distanceKm: number }[];
  nearestParks: { name: string; distanceKm: number }[];
  nearestMalls: { name: string; distanceKm: number }[];
  nearestHospitals: { name: string; distanceKm: number }[];
  nearestRestaurants: number;
  safetyRating: number;
  walkabilityScore: number;
  noiseLevel: number;
  airQualityIndex: number;
  trafficConditions: string;
  publicTransport: {
    metroStations: { name: string; distanceKm: number }[];
    busStops: { name: string; distanceKm: number }[];
  };
  entertainment: {
    cinemas: { name: string; distanceKm: number }[];
    sportsFacilities: { name: string; distanceKm: number }[];
  };
  investmentPotentialScore: number;
  rentalYieldEstimate: number;
  pricePerSqm: number;
  areaPricePerSqmAvg: number;
  futureDevelopments: string[];
  neighborhoodDemographics: string;
  climateNotes: string;
  marketPricePrediction: {
    estimatedValue: number;
    priceStatus: string;
    confidence: number;
  };
  areaAnalysis: string;
};

export type OutputType = {
  report: AIReport;
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