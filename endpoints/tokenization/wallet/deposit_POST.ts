import { schema, OutputType } from "./deposit_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    // 1. Check KYC Status
    const kyc = await db
      .selectFrom("kycRecords")
      .where("userId", "=", userId)
      .select(["status"])
      .executeTakeFirst();

    if (kyc?.status !== "approved") {
      return new Response(
        superjson.stringify({ error: "KYC approval is required for deposits" }),
        { status: 403 }
      );
    }

    // 2. Perform Deposit Transaction
    const result = await db.transaction().execute(async (trx) => {
      // Ensure wallet exists (lock row for update)
      let wallet = await trx
        .selectFrom("investorWallets")
        .where("userId", "=", userId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

      if (!wallet) {
        // Create if not exists
        wallet = await trx
          .insertInto("investorWallets")
          .values({
            userId,
            balanceSar: 0,
            frozenSar: 0,
            totalDeposited: 0,
            totalWithdrawn: 0,
            totalInvested: 0,
            totalIncomeReceived: 0,
            updatedAt: new Date(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      // Create Transaction Record
      const transaction = await trx
        .insertInto("walletTransactions")
        .values({
          userId,
          walletId: wallet.id,
          type: "deposit",
          amount: input.amount,
          status: "completed",
          description: "Wallet Deposit",
          metadata: JSON.stringify({
            method: "manual_simulation", // In real app, this would come from payment gateway
            timestamp: new Date().toISOString(),
          }),
          completedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Update Wallet Balance
      const updatedWallet = await trx
        .updateTable("investorWallets")
        .set((eb) => ({
          balanceSar: eb("balanceSar", "+", input.amount),
          totalDeposited: eb("totalDeposited", "+", input.amount),
          updatedAt: new Date(),
        }))
        .where("id", "=", wallet.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Log Compliance
      await trx
        .insertInto("complianceLogs")
        .values({
          action: "wallet_deposit",
          entityType: "wallet_transaction",
          entityId: transaction.id,
          userId: userId,
          details: JSON.stringify({
            amount: input.amount,
            currency: "SAR",
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        })
        .execute();

      return { wallet: updatedWallet, transaction };
    });

    const response: OutputType = {
      wallet: result.wallet,
      transaction: result.transaction,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to deposit funds" }),
        { status: 401 }
      );
    }

    console.error("Wallet deposit error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to process deposit",
      }),
      { status: 400 }
    );
  }
}