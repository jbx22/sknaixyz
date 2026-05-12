import { schema, OutputType } from "./transactions_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    // Parse query params manually since this is a GET request
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

    // Validate input using schema (though it's query params, we can reuse the logic)
    const input = schema.parse({ page, pageSize });

    const offset = (input.page - 1) * input.pageSize;

    // Fetch transactions with pagination
    const transactions = await db
      .selectFrom("walletTransactions")
      .where("userId", "=", userId)
      .selectAll()
      .orderBy("createdAt", "desc")
      .limit(input.pageSize)
      .offset(offset)
      .execute();

    // Get total count for pagination
    const countResult = await db
      .selectFrom("walletTransactions")
      .where("userId", "=", userId)
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirst();

    const total = Number(countResult?.total ?? 0);

    const response: OutputType = {
      transactions,
      total,
      page: input.page,
      pageSize: input.pageSize,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to view transactions" }),
        { status: 401 }
      );
    }

    console.error("Wallet transactions error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch transactions",
      }),
      { status: 400 }
    );
  }
}