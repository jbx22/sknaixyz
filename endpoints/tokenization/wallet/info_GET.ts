import { OutputType } from "./info_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    // Try to fetch wallet, create if not exists
    // We use a transaction to ensure we get a wallet back even if we have to create it
    const wallet = await db.transaction().execute(async (trx) => {
      let w = await trx
        .selectFrom("investorWallets")
        .where("userId", "=", userId)
        .selectAll()
        .executeTakeFirst();

      if (!w) {
        // Create wallet if it doesn't exist
        // Using ON CONFLICT DO NOTHING to handle race conditions safely
        await trx
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
          .onConflict((oc) => oc.column("userId").doNothing())
          .execute();

        // Fetch again to be sure we have it
        w = await trx
          .selectFrom("investorWallets")
          .where("userId", "=", userId)
          .selectAll()
          .executeTakeFirstOrThrow();
      }
      return w;
    });

    const response: OutputType = {
      wallet,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view wallet info" }),
        { status: 401 }
      );
    }

    console.error("Wallet info error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch wallet info",
      }),
      { status: 400 }
    );
  }
}