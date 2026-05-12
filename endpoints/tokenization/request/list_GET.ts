import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : undefined,
      pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : undefined,
    };

    const input = schema.parse(rawInput);

    const offset = (input.page - 1) * input.pageSize;

    // Base query for count
    const countResult = await db
      .selectFrom("tokenizationRequests")
      .where("userId", "=", userId)
      .select(db.fn.countAll<string>().as("count"))
      .executeTakeFirst();

    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Main query
    const requests = await db
      .selectFrom("tokenizationRequests")
      .innerJoin("properties", "tokenizationRequests.propertyId", "properties.id")
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
        "properties.images as propertyImages",
      ])
      .where("tokenizationRequests.userId", "=", userId)
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
      return new Response(
        superjson.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}