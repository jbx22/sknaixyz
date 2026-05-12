import { schema, OutputType } from "./details_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    await getServerUserSession(request);

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const rawInput = {
      assetId: searchParams.assetId ? Number(searchParams.assetId) : undefined,
    };

    const input = schema.parse(rawInput);

    const offering = await db
      .selectFrom("tokenizedAssets")
      .innerJoin("properties", "tokenizedAssets.propertyId", "properties.id")
      .innerJoin("spvs", "tokenizedAssets.spvId", "spvs.id")
      .where("tokenizedAssets.id", "=", input.assetId)
      .select([
        "tokenizedAssets.id",
        "tokenizedAssets.propertyId",
        "tokenizedAssets.spvId",
        "tokenizedAssets.totalValue",
        "tokenizedAssets.tokenPrice",
        "tokenizedAssets.totalTokens",
        "tokenizedAssets.tokensSold",
        "tokenizedAssets.annualRentalYield",
        "tokenizedAssets.incomeRights",
        "tokenizedAssets.votingRights",
        "tokenizedAssets.lockUpDays",
        "tokenizedAssets.transferable",
        "tokenizedAssets.offeringStatus",
        "tokenizedAssets.createdAt",
        "tokenizedAssets.titleDeedUrl",
        "tokenizedAssets.valuationReportUrl",
        "tokenizedAssets.settledAt",
        
        // Property details
        "properties.title as propertyTitle",
        "properties.description as propertyDescription",
        "properties.locationName as propertyLocation",
        "properties.images as propertyImages",
        "properties.propertyType",
        "properties.bedrooms",
        "properties.bathrooms",
        "properties.areaSqm",
        "properties.yearBuilt",
        "properties.latitude",
        "properties.longitude",
        
        // SPV details
        "spvs.name as spvName",
        "spvs.legalStructure as spvLegalStructure",
        "spvs.registrationNumber as spvRegistrationNumber",
        "spvs.legalDocuments as spvLegalDocuments",
      ])
      .select(
        sql<number>`("tokenized_assets"."total_tokens" - "tokenized_assets"."tokens_sold")`.as("availableTokens")
      )
      .executeTakeFirst();

    if (!offering) {
      return new Response(
        superjson.stringify({ error: "Offering not found" }),
        { status: 404 }
      );
    }

    const response: OutputType = {
      offering: offering as OutputType["offering"],
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view offering details" }),
        { status: 401 }
      );
    }
    console.error("Error getting offering details:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to get offering details",
      }),
      { status: 400 }
    );
  }
}