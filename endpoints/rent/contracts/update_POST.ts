import { schema, OutputType } from "./update_POST.schema";
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
    const values: Record<string, unknown> = {};
    if (input.contractStatus) values.contractStatus = input.contractStatus;
    if (input.monthlyRent !== undefined) values.monthlyRent = String(input.monthlyRent);
    if (input.endDate) values.endDate = new Date(input.endDate);
    if (input.notes !== undefined) values.notes = input.notes;
    values.updatedAt = new Date();
    if (Object.keys(values).length === 1) return new Response(superjson.stringify({ error: "No fields to update" }), { status: 400 });
    await db.updateTable("rentalContracts").set(values).where("id", "=", input.contractId).execute();
    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
