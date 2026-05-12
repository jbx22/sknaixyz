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
      search: searchParams.search || undefined,
      role: searchParams.role || undefined,
      subscriptionTier: searchParams.subscriptionTier || undefined,
      status: searchParams.status || undefined,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.limit;

    let query = db.selectFrom("users");

    if (input.search) {
      const searchTerm = `%${input.search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("email", "ilike", searchTerm),
          eb("displayName", "ilike", searchTerm),
        ])
      );
    }

    if (input.role) {
      query = query.where("role", "=", input.role);
    }

    if (input.subscriptionTier) {
      query = query.where("subscriptionTier", "=", input.subscriptionTier);
    }

    if (input.status) {
      query = query.where("status", "=", input.status);
    }

    // Get total count for pagination
    const countResult = await query
      .select((eb) => eb.fn.count("id").as("count"))
      .executeTakeFirst();
    
    const total = Number(countResult?.count ?? 0);

    // Get paginated results
    const users = await query
      .select([
        "id",
        "email",
        "displayName",
        "role",
        "subscriptionTier",
        "status",
        "createdAt",
        "avatarUrl",
      ])
      .orderBy("createdAt", "desc")
      .limit(input.limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        users,
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