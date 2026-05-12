import { schema, OutputType } from "./logs_GET.schema";
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
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 20,
      entityType: searchParams.entityType || undefined,
      action: searchParams.action || undefined,
      userId: searchParams.userId ? Number(searchParams.userId) : undefined,
      dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.pageSize;

    // Base query builder function to ensure consistent filtering for both count and data
    const buildQuery = () => {
      let q = db
        .selectFrom("complianceLogs")
        .leftJoin("users", "complianceLogs.userId", "users.id");

      if (input.entityType) {
        q = q.where("complianceLogs.entityType", "=", input.entityType);
      }

      if (input.action) {
        q = q.where("complianceLogs.action", "like", `%${input.action}%`);
      }

      if (input.userId) {
        q = q.where("complianceLogs.userId", "=", input.userId);
      }

      if (input.dateFrom) {
        q = q.where("complianceLogs.createdAt", ">=", input.dateFrom);
      }

      if (input.dateTo) {
        q = q.where("complianceLogs.createdAt", "<=", input.dateTo);
      }

      return q;
    };

    // Get total count
    const countResult = await buildQuery()
      .select((eb) => eb.fn.count("complianceLogs.id").as("count"))
      .executeTakeFirst();
    
    const total = Number(countResult?.count ?? 0);

    // Get paginated logs
    const logs = await buildQuery()
      .select([
        "complianceLogs.id",
        "complianceLogs.userId",
        "users.email as userEmail",
        "users.displayName as userDisplayName",
        "complianceLogs.entityType",
        "complianceLogs.entityId",
        "complianceLogs.action",
        "complianceLogs.details",
        "complianceLogs.ipAddress",
        "complianceLogs.createdAt",
      ])
      .orderBy("complianceLogs.createdAt", "desc")
      .limit(input.pageSize)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        logs,
        total,
        page: input.page,
        pageSize: input.pageSize,
      } as OutputType)
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