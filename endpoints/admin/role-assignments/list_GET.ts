import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    // Superadmin sees all, admin sees own
    const isSuperadmin = session.user.role === "superadmin";

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const rawInput = {
      page: searchParams.page ? Number(searchParams.page) : 1,
      limit: searchParams.limit ? Number(searchParams.limit) : 20,
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.limit;

    let q = db
      .selectFrom("adminRoleAssignments")
      .innerJoin("users", "adminRoleAssignments.userId", "users.id")
      .innerJoin("users as assigner", "adminRoleAssignments.assignedBy", "assigner.id");

    if (!isSuperadmin) {
      q = q.where("adminRoleAssignments.userId", "=", session.user.id);
    }

    const countResult = await q
      .select((eb) => eb.fn.count("adminRoleAssignments.id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const assignments = await q
      .select([
        "adminRoleAssignments.id",
        "adminRoleAssignments.userId",
        "adminRoleAssignments.assignedRole",
        "adminRoleAssignments.assignedBy",
        "adminRoleAssignments.scope",
        "adminRoleAssignments.isActive",
        "adminRoleAssignments.createdAt",
        "adminRoleAssignments.revokedAt",
        "users.displayName as userName",
        "users.email as userEmail",
        "assigner.displayName as assignerName",
      ])
      .orderBy("adminRoleAssignments.createdAt", "desc")
      .limit(input.limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        assignments,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
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
