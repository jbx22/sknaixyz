import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : 1,
      limit: searchParams.limit ? Number(searchParams.limit) : 20,
      unread: searchParams.unread === "true" ? true : undefined,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.limit;

    // Get unread count
    const unreadResult = await db
      .selectFrom("notifications")
      .select((eb) => eb.fn.count("id").as("count"))
      .where("userId", "=", session.user.id)
      .where("isRead", "=", false)
      .executeTakeFirst();

    const unreadCount = Number(unreadResult?.count ?? 0);

    // Build filtered query
    let q = db
      .selectFrom("notifications")
      .where("userId", "=", session.user.id);

    if (input.unread) {
      q = q.where("isRead", "=", false);
    }

    const countResult = await q
      .select((eb) => eb.fn.count("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    let selectQ = db
      .selectFrom("notifications")
      .where("userId", "=", session.user.id);

    if (input.unread) {
      selectQ = selectQ.where("isRead", "=", false);
    }

    const notifications = await selectQ
      .select([
        "id",
        "title",
        "message",
        "type",
        "isRead",
        "actionUrl",
        "metadata",
        "createdAt",
      ])
      .orderBy("createdAt", "desc")
      .limit(input.limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        notifications,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
        unreadCount,
      } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}
