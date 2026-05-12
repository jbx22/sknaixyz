import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../../helpers/db";
import { getServerUserSession } from "../../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : undefined,
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : undefined,
      status: searchParams.status || undefined,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.pageSize;

    // Build count query
    let countQuery = db
      .selectFrom("tokenizationRequests")
      .innerJoin("properties", "tokenizationRequests.propertyId", "properties.id")
      .innerJoin("users", "tokenizationRequests.userId", "users.id");

    if (input.status) {
      countQuery = countQuery.where("tokenizationRequests.status", "=", input.status);
    }

    const countResult = await countQuery
      .select(db.fn.countAll<string>().as("count"))
      .executeTakeFirst();
    
    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Build data query
    let dataQuery = db
      .selectFrom("tokenizationRequests")
      .innerJoin("properties", "tokenizationRequests.propertyId", "properties.id")
      .innerJoin("users", "tokenizationRequests.userId", "users.id");

    if (input.status) {
      dataQuery = dataQuery.where("tokenizationRequests.status", "=", input.status);
    }

    const requests = await dataQuery
      .select([
        "tokenizationRequests.id",
        "tokenizationRequests.userId",
        "tokenizationRequests.propertyId",
        "tokenizationRequests.estimatedValue",
        "tokenizationRequests.desiredTokenPrice",
        "tokenizationRequests.notes",
        "tokenizationRequests.status",
        "tokenizationRequests.rejectionReason",
        "tokenizationRequests.adminNotes",
        "tokenizationRequests.reviewedBy",
        "tokenizationRequests.reviewedAt",
        "tokenizationRequests.createdAt",
        "tokenizationRequests.updatedAt",
        "properties.title as propertyTitle",
        "properties.locationName as propertyLocation",
        "users.displayName as ownerName",
        "users.email as ownerEmail",
      ])
      .orderBy("tokenizationRequests.createdAt", "desc")
      .limit(input.pageSize)
      .offset(offset)
      .execute();

    const response: OutputType = {
      requests,
      total,
      page: input.page,
      pageSize: input.pageSize,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}