import { schema, OutputType } from "./create_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { generateAIReportBackground } from "../../helpers/generateAIReportBackground";

export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      // 1MB limit
      return new Response(
        superjson.stringify({ error: "Request payload too large" }),
        { status: 413 }
      );
    }

    // Authenticate user
    let currentUserId: number;
    try {
      const session = await getServerUserSession(request);
      currentUserId = session.user.id;
    } catch (e) {
      throw new NotAuthenticatedError();
    }

    // Parse input
    const json = superjson.parse(body);
    const input = schema.parse(json);

    // Insert into database
    const result = await db
      .insertInto("properties")
      .values({
        title: input.title,
        description: input.description,
        price: input.price,
        locationName: input.locationName,
        latitude: input.latitude,
        longitude: input.longitude,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms ?? null,
        areaSqm: input.areaSqm,
        propertyType: input.propertyType,
        status: "available", // Default status
        zipCode: input.zipCode ?? null,
        images: input.images ?? null,
        userId: currentUserId,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Trigger AI report generation in the background (fire and forget)
    // Get user's subscription tier
    const user = await db
      .selectFrom("users")
      .select("subscriptionTier")
      .where("id", "=", currentUserId)
      .executeTakeFirstOrThrow();

    // Fire and forget - don't await, let it run in background
    generateAIReportBackground(result.id, user.subscriptionTier).catch(
      (error) => {
        console.error(
          `Failed to trigger background AI report for property ${result.id}:`,
          error
        );
        // Swallow the error - property creation should still succeed
      }
    );

    // Auto-assign property owner membership
    await db.insertInto("propertyMembers")
      .values({
        propertyId: result.id,
        userId: currentUserId,
        role: "owner",
        grantedBy: currentUserId,
      })
      .onConflict((oc) => oc.columns(["propertyId", "userId", "role"]).doNothing())
      .execute()
      .catch(() => {}); // Ignore conflict errors

    return new Response(
      superjson.stringify({ property: result } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "You must be logged in to create a property" }),
        { status: 401 }
      );
    }

    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 }
    );
  }
}