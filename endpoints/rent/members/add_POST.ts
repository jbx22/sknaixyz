import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import superjson from "superjson";
import { isPlatformAdmin, canAccessProperty } from "../../../helpers/propertyAccess";
import type { Request } from "express";
import { db } from "../../../helpers/db";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    const body = await request.json();
    const { propertyId, userId, role } = body;

    if (!propertyId || !userId) {
      return new Response(
        superjson.stringify({ error: "propertyId and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Only admins or property owners/managers can add members
    if (!isPlatformAdmin(session.user.role)) {
      const hasAccess = await canAccessProperty(session.user.id, session.user.role, Number(propertyId));
      if (!hasAccess) {
        return new Response(
          superjson.stringify({ error: "You don't have permission to manage this property" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const membership = await db.insertInto("propertyMembers")
      .values({
        propertyId: Number(propertyId),
        userId: Number(userId),
        role: role || "owner",
        grantedBy: session.user.id,
      })
      .onConflict((oc) => oc.columns(["propertyId", "userId", "role"]).doNothing())
      .returning(["id"])
      .executeTakeFirst();

    if (!membership) {
      return new Response(
        superjson.stringify({ success: true, membershipId: 0, message: "Membership already exists" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      superjson.stringify({ success: true, membershipId: membership.id }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: error.message }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[rent/members/add]", error);
    return new Response(
      superjson.stringify({ error: error.message || "Failed to add property member" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
