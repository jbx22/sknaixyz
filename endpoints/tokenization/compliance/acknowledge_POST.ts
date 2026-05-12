import { schema, OutputType } from "./acknowledge_POST.schema";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    const userId = session.user.id;

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      // Upsert acknowledgement
      // We can't use simple upsert because we want to update timestamp if it exists
      const existing = await trx
        .selectFrom("investorAcknowledgements")
        .where("userId", "=", userId)
        .where("acknowledgementType", "=", input.acknowledgementType)
        .select("id")
        .executeTakeFirst();

      if (existing) {
        await trx
          .updateTable("investorAcknowledgements")
          .where("id", "=", existing.id)
          .set({
            version: input.version,
            acknowledgedAt: new Date(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          })
          .execute();
      } else {
        await trx
          .insertInto("investorAcknowledgements")
          .values({
            userId,
            acknowledgementType: input.acknowledgementType,
            version: input.version,
            acknowledgedAt: new Date(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          })
          .execute();
      }

      // Log compliance
      await trx
        .insertInto("complianceLogs")
        .values({
          action: "risk_acknowledgement",
          entityType: "user",
          entityId: userId,
          userId,
          details: {
            type: input.acknowledgementType,
            version: input.version,
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        })
        .execute();
    });

    const response: OutputType = {
      acknowledged: true,
      type: input.acknowledgementType,
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to acknowledge risks" }),
        { status: 401 }
      );
    }
    console.error("Acknowledgement error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to acknowledge",
      }),
      { status: 400 }
    );
  }
}