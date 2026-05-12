import { schema, OutputType } from "./request_deletion_POST.schema";
import superjson from 'superjson';
import { getServerSessionOrThrow } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { notes } = schema.parse(json);

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

    // 2. Check for existing pending request
    const existingRequest = await db
      .selectFrom("dataDeletionRequests")
      .select("id")
      .where("userId", "=", sessionRecord.userId)
      .where("status", "=", "pending")
      .executeTakeFirst();

    if (existingRequest) {
      return new Response(superjson.stringify({ error: "You already have a pending deletion request." }), { status: 400 });
    }

    // 3. Create Deletion Request
    const newRequest = await db
      .insertInto("dataDeletionRequests")
      .values({
        userId: sessionRecord.userId,
        status: "pending",
        requestedAt: new Date(),
        notes: notes || null,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    console.log(`[Deletion Request] User ${sessionRecord.userId} requested account deletion. Request ID: ${newRequest.id}`);

    return new Response(superjson.stringify({ 
      success: true, 
      requestId: newRequest.id,
      message: "Account deletion request submitted successfully." 
    } satisfies OutputType));

  } catch (error) {
    console.error("Deletion request error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Not authenticated" ? 401 : 400;
    return new Response(superjson.stringify({ error: message }), { status });
  }
}