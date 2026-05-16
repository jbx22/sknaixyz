import { schema, OutputType } from "./work-history_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : 1,
      limit: searchParams.limit ? Number(searchParams.limit) : 20,
      adminId: searchParams.adminId ? Number(searchParams.adminId) : undefined,
      actionType: searchParams.actionType || undefined,
      dateFrom: searchParams.dateFrom || undefined,
      dateTo: searchParams.dateTo || undefined,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.limit;

    const buildFilteredQuery = () => {
      let q = db
        .selectFrom("adminActivityLogs")
        .innerJoin("users", "adminActivityLogs.adminId", "users.id");

      if (input.adminId) {
        q = q.where("adminActivityLogs.adminId", "=", input.adminId);
      }

      if (input.actionType) {
        q = q.where("adminActivityLogs.actionType", "=", input.actionType);
      }

      if (input.dateFrom) {
        q = q.where("adminActivityLogs.createdAt", ">=", new Date(input.dateFrom));
      }

      if (input.dateTo) {
        q = q.where("adminActivityLogs.createdAt", "<=", new Date(input.dateTo));
      }

      return q;
    };

    const countResult = await buildFilteredQuery()
      .select((eb) => eb.fn.count("adminActivityLogs.id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const logs = await buildFilteredQuery()
      .select([
        "adminActivityLogs.id",
        "adminActivityLogs.actionType",
        "adminActivityLogs.targetType",
        "adminActivityLogs.targetId",
        "adminActivityLogs.targetUserId",
        "adminActivityLogs.details",
        "adminActivityLogs.outcome",
        "adminActivityLogs.ipAddress",
        "adminActivityLogs.createdAt",
        "users.displayName as adminName",
        "users.email as adminEmail",
      ])
      .orderBy("adminActivityLogs.createdAt", "desc")
      .limit(input.limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        logs,
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
