import { schema, OutputType } from "./cancel_deletion_POST.schema";
import superjson from 'superjson';
import { getServerSessionOrThrow } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    // 1. Authenticate User
    const session = await getServerSessionOrThrow(request);
    
    const sessionRecord = await db
      .selectFrom("sessions")
      .select("userId")
      .where("id", "=", session.id)
      .executeTakeFirst();

    if (!sessionRecord) {
      return new Response(superjson.stringify({ error: "Session invalid" }), { status: 401 });
    }

    // 2. Find and Update Pending Requests
    const result = await db
      .updateTable("dataDeletionRequests")
      .set({
        status: "cancelled",
        processedAt: new Date() // Marking processedAt as the time it was cancelled
      })
      .where("userId", "=", sessionRecord.userId)
      .where("status", "=", "pending")
      .returning("id")
      .execute();

    if (result.length === 0) {
      return new Response(superjson.stringify({ error: "No pending deletion request found to cancel." }), { status: 404 });
    }

    console.log(`[Deletion Cancel] User ${sessionRecord.userId} cancelled deletion request(s): ${result.map(r => r.id).join(", ")}`);

    return new Response(superjson.stringify({ 
      success: true, 
      message: "Account deletion request cancelled successfully." 
    } satisfies OutputType));

  } catch (error) {
    console.error("Cancel deletion error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Not authenticated" ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), { status });
  }
}