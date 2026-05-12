import { schema, OutputType } from "./list_GET.schema";
import superjson from "superjson";
import { db } from '../../../../helpers/db';
import { getServerUserSession } from '../../../../helpers/getServerUserSession';
import { NotAuthenticatedError } from '../../../../helpers/getSetServerSession';

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
      status: searchParams.status || undefined,
      search: searchParams.search || undefined
    };

    const input = schema.parse(rawInput);
    const offset = (input.page - 1) * input.pageSize;

    let query = db.
    selectFrom("kycRecords").
    innerJoin("users", "kycRecords.userId", "users.id").
    select([
    "kycRecords.id",
    "kycRecords.userId",
    "users.displayName as userDisplayName",
    "users.email as userEmail",
    "kycRecords.nationalId",
    "kycRecords.fullNameAr",
    "kycRecords.fullNameEn",
    "kycRecords.dateOfBirth",
    "kycRecords.nationality",
    "kycRecords.address",
    "kycRecords.phone",
    "kycRecords.status",
    "kycRecords.suitability",
    "kycRecords.rejectionReason",
    "kycRecords.createdAt",
    "kycRecords.updatedAt",
    "kycRecords.verifiedAt"]
    );

    if (input.status) {
      query = query.where("kycRecords.status", "=", input.status);
    }

    if (input.search) {
      const searchTerm = `%${input.search.toLowerCase()}%`;
      query = query.where((eb) =>
      eb.or([
      eb("kycRecords.fullNameEn", "ilike", searchTerm),
      eb("kycRecords.fullNameAr", "ilike", searchTerm),
      eb("kycRecords.nationalId", "ilike", searchTerm),
      eb("users.email", "ilike", searchTerm)]
      )
      );
    }

    // Get total count
    const countResult = await query.
    clearSelect().
    select((eb) => eb.fn.count("kycRecords.id").as("count")).
    executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    // Get paginated results
    const records = await query.
    orderBy("kycRecords.createdAt", "desc").
    limit(input.pageSize).
    offset(offset).
    execute();

    return new Response(
      superjson.stringify({
        records,
        total,
        page: input.page,
        pageSize: input.pageSize
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