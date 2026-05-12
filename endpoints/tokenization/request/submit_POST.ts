import { schema, OutputType } from "./submit_POST.schema";
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

    // 1. Validate property ownership
    const property = await db
      .selectFrom("properties")
      .select(["id", "userId"])
      .where("id", "=", input.propertyId)
      .executeTakeFirst();

    if (!property) {
      return new Response(
        superjson.stringify({ error: "Property not found" }),
        { status: 404 }
      );
    }

    if (property.userId !== userId) {
      return new Response(
        superjson.stringify({ error: "You do not own this property" }),
        { status: 403 }
      );
    }

    // 2. Check if already tokenized
    const existingTokenization = await db
      .selectFrom("tokenizedAssets")
      .select("id")
      .where("propertyId", "=", input.propertyId)
      .executeTakeFirst();

    if (existingTokenization) {
      return new Response(
        superjson.stringify({ error: "Property is already tokenized" }),
        { status: 400 }
      );
    }

    // 3. Check for existing active requests (pending or under_review)
    const existingRequest = await db
      .selectFrom("tokenizationRequests")
      .select("id")
      .where("propertyId", "=", input.propertyId)
      .where("status", "in", ["pending", "under_review"])
      .executeTakeFirst();

    if (existingRequest) {
      return new Response(
        superjson.stringify({
          error: "There is already an active tokenization request for this property",
        }),
        { status: 400 }
      );
    }

    // 4. Create request and log to compliance
    const result = await db.transaction().execute(async (trx) => {
      const tokenizationRequest = await trx
        .insertInto("tokenizationRequests")
        .values({
          userId,
          propertyId: input.propertyId,
          estimatedValue: input.estimatedValue?.toString() || null,
          desiredTokenPrice: input.desiredTokenPrice?.toString() || null,
          notes: input.notes || null,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("complianceLogs")
        .values({
          action: "tokenization_request_submit",
          entityType: "tokenization_request",
          entityId: tokenizationRequest.id,
          userId: userId,
          details: JSON.stringify({
            propertyId: input.propertyId,
            estimatedValue: input.estimatedValue,
            submittedAt: new Date().toISOString(),
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          createdAt: new Date(),
        })
        .execute();

      return tokenizationRequest;
    });

    const response: OutputType = {
      request: result,
      message: "Tokenization request submitted successfully",
    };

    return new Response(superjson.stringify(response));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to submit a request" }),
        { status: 401 }
      );
    }

    console.error("Tokenization request submit error:", error);
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Failed to submit request",
      }),
      { status: 400 }
    );
  }
}