import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : 1,
      limit: searchParams.limit ? Number(searchParams.limit) : 20,
      userId: searchParams.userId ? Number(searchParams.userId) : undefined,
      tier: searchParams.tier || undefined,
      status: searchParams.status || undefined,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.limit;

    // Create a function that builds the base query with filters fresh each time
    const buildFilteredQuery = () => {
      let q = db
        .selectFrom("subscriptionPayments")
        .innerJoin("users", "subscriptionPayments.userId", "users.id");

      if (input.userId) {
        q = q.where("subscriptionPayments.userId", "=", input.userId);
      }

      if (input.tier) {
        q = q.where("subscriptionPayments.tier", "=", input.tier);
      }

      if (input.status === "active") {
        q = q.where("subscriptionPayments.expiresAt", ">", new Date());
      } else if (input.status === "expired") {
        q = q.where("subscriptionPayments.expiresAt", "<=", new Date());
      }

      return q;
    };

    // Get total count - call function to get fresh query builder
    const countResult = await buildFilteredQuery()
      .select((eb) => eb.fn.count("subscriptionPayments.id").as("count"))
      .executeTakeFirst();
    
    const total = Number(countResult?.count ?? 0);

    // Get paginated results - call function again to get another fresh query builder
    const subscriptions = await buildFilteredQuery()
      .select([
        "subscriptionPayments.id",
        "subscriptionPayments.amount",
        "subscriptionPayments.currency",
        "subscriptionPayments.tier",
        "subscriptionPayments.paymentStatus",
        "subscriptionPayments.paymentMethod",
        "subscriptionPayments.transactionId",
        "subscriptionPayments.startedAt",
        "subscriptionPayments.expiresAt",
        "subscriptionPayments.createdAt",
        "subscriptionPayments.userId",
        "users.displayName as userName",
        "users.email as userEmail",
      ])
      .orderBy("subscriptionPayments.startedAt", "desc")
      .limit(input.limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        subscriptions,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      } satisfies OutputType)
    );
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