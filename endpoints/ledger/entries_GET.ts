import { schema, OutputType } from "./entries_GET.schema";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getLedgerEntries } from "../../helpers/blockchainLedger";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Parse query params using schema to ensure types
    // We need to manually construct the object for schema parsing because URLSearchParams are strings
    const rawInput = {
      ...queryParams,
      assetId: queryParams.assetId ? Number(queryParams.assetId) : undefined,
      userId: queryParams.userId ? Number(queryParams.userId) : undefined,
      page: queryParams.page ? Number(queryParams.page) : undefined,
      limit: queryParams.limit ? Number(queryParams.limit) : undefined,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
    };

    const input = schema.parse(rawInput);

    const entries = await getLedgerEntries({
      assetId: input.assetId,
      userId: input.userId,
      entryType: input.entryType,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      page: input.page,
      limit: input.limit,
    });

    // Get total count for pagination
    let countQuery = db.selectFrom("ledgerEntries").select(db.fn.count("id").as("total"));

    if (input.assetId) {
      countQuery = countQuery.where("assetId", "=", input.assetId);
    }
    if (input.userId) {
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("fromUserId", "=", input.userId!),
          eb("toUserId", "=", input.userId!),
        ])
      );
    }
    if (input.entryType) {
      countQuery = countQuery.where("entryType", "=", input.entryType);
    }
    if (input.status) {
      countQuery = countQuery.where("status", "=", input.status);
    }
    if (input.startDate) {
      countQuery = countQuery.where("createdAt", ">=", input.startDate);
    }
    if (input.endDate) {
      countQuery = countQuery.where("createdAt", "<=", input.endDate);
    }

    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.total || 0);

    return new Response(
      superjson.stringify({
        entries,
        total,
        page: input.page,
        limit: input.limit,
      } satisfies OutputType)
    );
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}