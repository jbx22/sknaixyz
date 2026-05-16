import { schema, OutputType } from "./create_POST.schema";
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
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const unit = await db.insertInto("propertyUnits").values({
      propertyId: input.propertyId,
      unitNumber: input.unitNumber,
      floorNumber: input.floorNumber ?? null,
      areaSqm: String(input.areaSqm ?? 0),
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      monthlyRent: String(input.monthlyRent ?? 0),
      description: input.description ?? null,
    }).returning("id").executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ success: true, unit: { id: Number(unit.id) } } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
