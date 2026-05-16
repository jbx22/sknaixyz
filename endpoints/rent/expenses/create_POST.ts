import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    const body = superjson.parse(await request.text());
    const input = schema.parse(body);
    const expense = await db.insertInto("propertyExpenses").values({
      propertyId: input.propertyId,
      category: input.category,
      description: input.description ?? null,
      amount: String(input.amount),
      expenseDate: new Date(input.expenseDate),
      receiptUrl: input.receiptUrl ?? null,
      recordedBy: session.user.id,
    }).returning("id").executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ success: true, expense: { id: Number(expense.id) } } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
