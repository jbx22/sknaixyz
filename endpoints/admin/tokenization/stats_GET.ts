import { schema, OutputType } from "./stats_GET.schema";
import superjson from "superjson";
import { db } from '../../../helpers/db';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../helpers/getSetServerSession';
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Run queries in parallel for performance
    const [
    assetStats,
    investorStats,
    kycStats,
    walletStats,
    incomeStats,
    secondaryStats] =
    await Promise.all([
    // Asset stats
    db.
    selectFrom("tokenizedAssets").
    select([
    db.fn.count("id").as("totalAssets"),
    db.fn.sum("tokensSold").as("totalTokensSold"),
    sql<string>`sum("tokens_sold" * "token_price")`.as("totalValueLocked")]
    ).
    executeTakeFirst(),

    // Investor stats (distinct users with holdings > 0)
    db.
    selectFrom("tokenHoldings").
    select(db.fn.countAll().as("count")) // Approximate, better to do distinct count
    .where("quantity", ">", 0).
    executeTakeFirst(),
    // Note: Kysely count distinct is a bit tricky, let's do a raw count of distinct userIds
    // Actually, let's use a separate query for distinct count

    // KYC stats
    db.
    selectFrom("kycRecords").
    select([
    sql<string>`count(case when status = 'pending' then 1 end)`.as("pendingCount"),
    sql<string>`count(case when status = 'approved' then 1 end)`.as("approvedCount")]
    ).
    executeTakeFirst(),

    // Wallet stats
    db.
    selectFrom("investorWallets").
    select(db.fn.sum("balanceSar").as("totalBalance")).
    executeTakeFirst(),

    // Income stats
    db.
    selectFrom("incomeDistributions").
    select(db.fn.sum("totalAmount").as("totalDistributed")).
    executeTakeFirst(),

    // Secondary market stats
    db.
    selectFrom("secondaryListings").
    select(db.fn.count("id").as("activeCount")).
    where("status", "=", "active").
    executeTakeFirst()]
    );

    // Correct investor count query
    const distinctInvestors = await db.
    selectFrom("tokenHoldings").
    select(sql<string>`count(distinct "user_id")`.as("count")).
    where("quantity", ">", 0).
    executeTakeFirst();

    const stats: OutputType = {
      totalTokenizedAssets: Number(assetStats?.totalAssets ?? 0),
      totalTokensSold: Number(assetStats?.totalTokensSold ?? 0),
      totalValueLocked: Number(assetStats?.totalValueLocked ?? 0),
      totalInvestors: Number(distinctInvestors?.count ?? 0),
      pendingKycCount: Number(kycStats?.pendingCount ?? 0),
      approvedKycCount: Number(kycStats?.approvedCount ?? 0),
      totalWalletBalance: Number(walletStats?.totalBalance ?? 0),
      totalIncomeDistributed: Number(incomeStats?.totalDistributed ?? 0),
      activeSecondaryListings: Number(secondaryStats?.activeCount ?? 0)
    };

    return new Response(superjson.stringify(stats));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}