import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { superjson } from "../../../helpers/schema";
import { getPropertyAccess, isPlatformAdmin } from "../../../helpers/propertyAccess";
import type { Request } from "express";
import { db } from "../../../helpers/db";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    const userId = session.user.id;
    const userRole = session.user.role as any;
    const access = await getPropertyAccess(userId, userRole);

    if (access.propertyIds.length === 0) {
      return new Response(
        superjson.stringify({ properties: [], access }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get properties with rent stats
    const properties = await db.selectFrom("properties")
      .where("id", "in", access.propertyIds)
      .select([
        "id", "title", "locationName", "status",
      ])
      .execute();

    // Get stats for each property
    const results = [];
    for (const prop of properties) {
      const units = await db.selectFrom("propertyUnits")
        .where("propertyId", "=", prop.id)
        .select(db.fn.count("id").as("cnt"))
        .executeTakeFirst();

      const contracts = await db.selectFrom("rentalContracts")
        .where("propertyId", "=", prop.id)
        .where("contractStatus", "=", "active")
        .select(db.fn.count("id").as("cnt"))
        .executeTakeFirst();

      const income = await db.selectFrom("rentalContracts")
        .where("propertyId", "=", prop.id)
        .where("contractStatus", "=", "active")
        .select(db.fn.sum("monthlyRent").as("total"))
        .executeTakeFirst();

      // Determine user's role for this property
      let myRole = "owner";
      if (isPlatformAdmin(userRole)) {
        myRole = "admin";
      } else {
        const member = await db.selectFrom("propertyMembers")
          .where("propertyId", "=", prop.id)
          .where("userId", "=", userId)
          .select(["role"])
          .executeTakeFirst();
        if (member) myRole = member.role;
        else if ((prop as any).userId === userId) myRole = "owner";
      }

      results.push({
        id: prop.id,
        title: prop.title,
        locationName: prop.locationName,
        status: prop.status,
        myRole,
        unitsCount: Number((units as any)?.cnt || 0),
        activeContracts: Number((contracts as any)?.cnt || 0),
        monthlyIncome: Number((income as any)?.total || 0),
      });
    }

    return new Response(
      superjson.stringify({ properties: results, access }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: error.message }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[rent/my-properties]", error);
    return new Response(
      superjson.stringify({ error: error.message || "Failed to fetch properties" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
