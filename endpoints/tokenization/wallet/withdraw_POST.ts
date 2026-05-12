import { schema, OutputType } from "./withdraw_POST.schema";
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
        superjson.stringify({ error: "KYC approval is required for withdrawals" }),
        { status: 403 }
      );
    }

    // 2. Perform Withdrawal Transaction
    const result = await db.transaction().execute(async (trx) => {
      // Lock wallet for update
      const wallet = await trx
        .selectFrom("investorWallets")
        .where("userId", "=", userId)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Check sufficient funds (Available = Balance - Frozen)
      const availableBalance = Number(wallet.balanceSar) - Number(wallet.frozenSar);
      if (availableBalance < input.amount) {
        throw new Error("Insufficient available balance");
      }

      // Create Transaction Record
      const transaction = await trx
        .insertInto("walletTransactions")
        .values({
          userId,
          walletId: wallet.id,
          type: "withdrawal",
          amount: input.amount,
          status: "completed", // Assuming instant for this implementation, or 'pending' if manual review needed
          description: "Wallet Withdrawal",
          metadata: JSON.stringify({
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
          balanceSar: eb("balanceSar", "-", input.amount),
          totalWithdrawn: eb("totalWithdrawn", "+", input.amount),
          updatedAt: new Date(),
        }))
        .where("id", "=", wallet.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Log Compliance
      await trx
        .insertInto("complianceLogs")
        .values({
          action: "wallet_withdrawal",
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
        superjson.stringify({ error: "You must be logged in to withdraw funds" }),
        { status: 401 }
      );
    }

    console.error("Wallet withdrawal error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to process withdrawal",
      }),
      { status: 400 }
    );
  }
}