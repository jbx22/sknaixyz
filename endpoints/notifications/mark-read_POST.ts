import { schema, OutputType } from "./mark-read_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      return new Response(
        superjson.stringify({ error: "Request payload too large" }),
        { status: 413 }
      );
    }

    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    const json = superjson.parse(body);
    const input = schema.parse(json);

    const result = await db
      .updateTable("notifications")
      .set({ isRead: true })
      .where("userId", "=", session.user.id)
      .where("id", "in", input.notificationIds)
      .executeTakeFirst();

    return new Response(
      superjson.stringify({
        success: true,
        updatedCount: Number(result.numUpdatedRows ?? 0),
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
