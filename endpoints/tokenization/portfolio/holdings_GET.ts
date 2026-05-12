import { OutputType } from "./holdings_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    // Fetch holdings with joined details
    const holdings = await db
      .selectFrom("tokenHoldings")
      .innerJoin("tokenizedAssets", "tokenHoldings.tokenizedAssetId", "tokenizedAssets.id")
      .innerJoin("properties", "tokenizedAssets.propertyId", "properties.id")
      .innerJoin("spvs", "tokenizedAssets.spvId", "spvs.id")
      .where("tokenHoldings.userId", "=", userId)
      .where("tokenHoldings.quantity", ">", 0) // Only show active holdings
      .select([
        "tokenHoldings.id as holdingId",
        "tokenHoldings.quantity",
        "tokenHoldings.averagePurchasePrice",
        "tokenHoldings.totalInvested",
        "tokenHoldings.totalIncomeReceived",
        "tokenHoldings.acquiredAt",
        
        "tokenizedAssets.id as assetId",
        "tokenizedAssets.tokenPrice",
        "tokenizedAssets.totalTokens",
        "tokenizedAssets.annualRentalYield",
        
        "properties.title as propertyTitle",
        "properties.locationName as propertyLocation",
        "properties.images as propertyImages",
        
        "spvs.name as spvName",
      ])
      .execute();

    // Compute derived values
    let totalPortfolioValue = 0;
    let totalInvestedAll = 0;
    let totalIncomeAll = 0;

    const processedHoldings = holdings.map((h) => {
      const currentPrice = Number(h.tokenPrice); // In real app, this might be market price
      const currentValue = h.quantity * currentPrice;
      const ownershipPercentage = (h.quantity / h.totalTokens) * 100;

      totalPortfolioValue += currentValue;
      totalInvestedAll += Number(h.totalInvested);
      totalIncomeAll += Number(h.totalIncomeReceived);

      return {
        ...h,
        currentValue,
        ownershipPercentage,
      };
    });

    const response: OutputType = {
      holdings: processedHoldings,
      totalPortfolioValue,
      totalInvestedAll,
      totalIncomeAll,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view portfolio" }),
        { status: 401 }
      );
    }
    console.error("Portfolio holdings error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch portfolio",
      }),
      { status: 400 }
    );
  }
}