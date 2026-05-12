import { schema, OutputType } from "./distribute_POST.schema";
import superjson from "superjson";
import { db } from '../../../../helpers/db';
import { getServerUserSession } from '../../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../../helpers/getSetServerSession';
import { logAdminActivity } from '../../../../helpers/logAdminActivity';
import { sql } from "kysely";
import { checkOperationAllowed, recordIncomeDistribution } from "../../../../helpers/blockchainLedger";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await request.text();
    const json = superjson.parse(body);
    const input = schema.parse(json);

    const asset = await db.
    selectFrom("tokenizedAssets").
    select(["id", "totalTokens", "tokensSold", "spvId"]).
    where("id", "=", input.assetId).
    executeTakeFirst();

    if (!asset) {
      return new Response(superjson.stringify({ error: "Asset not found" }), { status: 404 });
    }

    if (asset.tokensSold === 0) {
      return new Response(superjson.stringify({ error: "No tokens sold for this asset" }), { status: 400 });
    }

    // Calculate amount per token based on total tokens (or tokens sold? usually distributions are per outstanding share)
    // If the issuer holds the unsold tokens, they should get paid too?
    // The prompt says "Find all token holders... where quantity > 0".
    // If we distribute based on totalTokens, then unsold tokens' income goes nowhere or to issuer?
    // Let's assume amountPerToken = totalAmount / tokensSold for now to distribute fully to investors,
    // OR amountPerToken = totalAmount / totalTokens if the intention is a fixed yield per share.
    // The prompt says "Calculate amountPerToken = totalAmount / totalTokens".
    // This implies that if only 50% sold, only 50% of the totalAmount is distributed to investors.
    const amountPerToken = input.totalAmount / asset.totalTokens;

    const result = await db.transaction().execute(async (trx) => {
      // Blockchain: Check emergency controls
      await checkOperationAllowed({ assetId: input.assetId, operationType: 'distribution', trx: trx });

      // 1. Create distribution record
      const distribution = await trx.
      insertInto("incomeDistributions").
      values({
        tokenizedAssetId: input.assetId,
        totalAmount: input.totalAmount.toString(),
        amountPerToken: amountPerToken.toString(),
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        distributionDate: new Date(),
        description: input.description,
        createdAt: new Date()
      }).
      returningAll().
      executeTakeFirstOrThrow();

      // 2. Find holders
      const holders = await trx.
      selectFrom("tokenHoldings").
      select(["userId", "quantity", "id"]).
      where("tokenizedAssetId", "=", input.assetId).
      where("quantity", ">", 0).
      execute();

      let totalDistributed = 0;
      let recipientCount = 0;

      for (const holder of holders) {
        const payout = amountPerToken * holder.quantity;
        if (payout <= 0) continue;

        // 3. Credit wallet
        // Check if wallet exists, create if not (though it should exist if they have holdings)
        let wallet = await trx.
        selectFrom("investorWallets").
        select("id").
        where("userId", "=", holder.userId).
        executeTakeFirst();

        if (!wallet) {
          wallet = await trx.
          insertInto("investorWallets").
          values({
            userId: holder.userId,
            balanceSar: "0",
            frozenSar: "0",
            totalDeposited: "0",
            totalWithdrawn: "0",
            totalInvested: "0",
            totalIncomeReceived: "0",
            createdAt: new Date(),
            updatedAt: new Date()
          }).
          returning("id").
          executeTakeFirstOrThrow();
        }

        // Update wallet balance
        await trx.
        updateTable("investorWallets").
        set((eb) => ({
          balanceSar: sql`balance_sar + ${payout}`,
          totalIncomeReceived: sql`total_income_received + ${payout}`,
          updatedAt: new Date()
        })).
        where("id", "=", wallet.id).
        execute();

        // Create transaction record
        await trx.
        insertInto("walletTransactions").
        values({
          walletId: wallet.id,
          userId: holder.userId,
          type: "income_distribution",
          amount: payout.toString(),
          status: "completed",
          description: `Income distribution for asset #${input.assetId}`,
          referenceId: `DIST-${distribution.id}`,
          metadata: JSON.stringify({ distributionId: distribution.id, periodStart: input.periodStart, periodEnd: input.periodEnd }),
          createdAt: new Date(),
          completedAt: new Date()
        }).
        execute();

        // Update holding stats
        await trx.
        updateTable("tokenHoldings").
        set((eb) => ({
          totalIncomeReceived: sql`total_income_received + ${payout}`,
          updatedAt: new Date()
        })).
        where("id", "=", holder.id).
        execute();

        totalDistributed += payout;
        recipientCount++;
      }

      // 4. Log compliance
      await trx.
      insertInto("complianceLogs").
      values({
        entityType: "INCOME_DISTRIBUTION",
        entityId: distribution.id,
        action: "DISTRIBUTE_INCOME",
        userId: session.user.id,
        details: JSON.stringify({
          assetId: input.assetId,
          totalAmount: input.totalAmount,
          recipients: recipientCount,
          distributedAmount: totalDistributed
        }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        createdAt: new Date()
      }).
      execute();

      // Blockchain: Record on ledger
      await recordIncomeDistribution({
        assetId: input.assetId,
        spvId: asset.spvId,
        totalAmount: input.totalAmount,
        amountPerToken,
        executedBy: session.user.id,
        metadata: { distributionId: distribution.id, recipientCount, totalDistributed }
      }, trx);

      return { distribution, recipientCount, totalDistributed };
    });

    await logAdminActivity({
      adminId: session.user.id,
      actionType: "DISTRIBUTE_INCOME",
      targetType: "TOKENIZED_ASSET",
      targetId: input.assetId,
      details: {
        amount: input.totalAmount,
        recipients: result.recipientCount
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown"
    });

    return new Response(superjson.stringify(result satisfies OutputType));
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