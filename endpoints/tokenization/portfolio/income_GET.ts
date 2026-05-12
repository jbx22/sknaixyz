import { schema, OutputType } from "./income_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : 1,
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 20,
    };

    const input = schema.parse(rawInput);

    // We need to find distributions relevant to the user.
    // A user receives income if they held tokens at the time of distribution.
    // However, the schema doesn't have a direct link between user and income_distribution except via wallet_transactions (type='income_distribution').
    // But the prompt asks to query `income_distributions` where user has holdings.
    // A more accurate way is to look at wallet_transactions of type 'income_distribution' which links to the user, 
    // but that table doesn't link back to the specific distribution ID easily (only via metadata or description).
    
    // Alternative interpretation: Show all distributions for assets the user CURRENTLY holds or HISTORICALLY held.
    // Let's use a join on tokenHoldings to find relevant assets, then get distributions for those assets.
    // AND we need to calculate what the user received.
    
    // Actually, the best source of truth for "User's Income History" is `walletTransactions` of type `income_distribution`.
    // But the prompt specifically asks to "Get income_distributions where the user has holdings... Compute userAmount".
    // This implies we are projecting what they *should* have received or just listing asset distributions.
    
    // Let's follow the prompt: "Get income_distributions where the user has holdings for that asset".
    // We will join income_distributions with token_holdings.
    
    let query = db
      .selectFrom("incomeDistributions")
      .innerJoin("tokenizedAssets", "incomeDistributions.tokenizedAssetId", "tokenizedAssets.id")
      .innerJoin("properties", "tokenizedAssets.propertyId", "properties.id")
      .innerJoin("tokenHoldings", "incomeDistributions.tokenizedAssetId", "tokenHoldings.tokenizedAssetId")
      .where("tokenHoldings.userId", "=", userId)
      // Only show distributions that happened after user acquired tokens? 
      // The prompt is simple, let's just show all for assets they hold.
      // Ideally we should check if they held it at distributionDate, but that requires historical balance tracking which is complex.
      // We'll use current holding quantity for the calculation as per prompt implication, or just list the distribution.
      .select([
        "incomeDistributions.id",
        "properties.title as propertyTitle",
        "incomeDistributions.totalAmount",
        "incomeDistributions.amountPerToken",
        "incomeDistributions.distributionDate",
        "incomeDistributions.periodStart",
        "incomeDistributions.periodEnd",
        "incomeDistributions.description",
        "tokenHoldings.quantity as userQuantity",
      ]);

    // Count total
    const countResult = await db
      .selectFrom("incomeDistributions")
      .innerJoin("tokenHoldings", "incomeDistributions.tokenizedAssetId", "tokenHoldings.tokenizedAssetId")
      .where("tokenHoldings.userId", "=", userId)
      .select(db.fn.countAll<string>().as("count"))
      .executeTakeFirst();

    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Pagination
    const offset = (input.page - 1) * input.pageSize;
    query = query
      .orderBy("incomeDistributions.distributionDate", "desc")
      .limit(input.pageSize)
      .offset(offset);

    const results = await query.execute();

    const distributions = results.map(d => ({
      id: d.id,
      propertyTitle: d.propertyTitle,
      totalAmount: d.totalAmount,
      amountPerToken: d.amountPerToken,
      userAmount: (Number(d.amountPerToken) * d.userQuantity).toString(), // Computed
      distributionDate: d.distributionDate,
      periodStart: d.periodStart,
      periodEnd: d.periodEnd,
      description: d.description,
    }));

    const response: OutputType = {
      distributions,
      total,
      page: input.page,
      pageSize: input.pageSize,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view income" }),
        { status: 401 }
      );
    }
    console.error("Income history error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch income history",
      }),
      { status: 400 }
    );
  }
}