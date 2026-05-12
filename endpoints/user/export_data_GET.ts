import { schema, OutputType } from "./export_data_GET.schema";
import superjson from 'superjson';
import { getServerSessionOrThrow } from "../../helpers/getSetServerSession";
import { exportUserData } from "../../helpers/exportUserData";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    // 1. Authenticate User
    const session = await getServerSessionOrThrow(request);
    
    // 2. Get User ID from session
    // We need to fetch the actual user ID from the session ID
    const sessionRecord = await db
      .selectFrom("sessions")
      .select("userId")
      .where("id", "=", session.id)
      .executeTakeFirst();

    if (!sessionRecord) {
      return new Response(superjson.stringify({ error: "Session invalid" }), { status: 401 });
    }

    // 3. Gather Data
    const exportData = await exportUserData(sessionRecord.userId);

    // 4. Log action (console only as we don't have a user activity log table)
    console.log(`[User Export] User ${sessionRecord.userId} exported their data at ${new Date().toISOString()}`);

    // 5. Return Data
    return new Response(superjson.stringify({ data: exportData } satisfies OutputType), { status: 200 });
  } catch (error) {
    console.error("Export data error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Not authenticated" ? 401 : 500;
    return new Response(superjson.stringify({ error: message }), { status });
  }
}