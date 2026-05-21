import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import superjson from "superjson";
import type { Request } from "express";
import { db } from "../../../helpers/db";
import { notifyLandlord } from "../../../helpers/notify";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    const body = await request.json();
    const { propertyId, unitId, startDate, endDate, notes } = body;

    if (!propertyId || !unitId || !startDate || !endDate) {
      return new Response(
        superjson.stringify({ error: "propertyId, unitId, startDate, and endDate are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify unit exists and is available
    const unit = await db.selectFrom("propertyUnits")
      .where("id", "=", Number(unitId))
      .where("propertyId", "=", Number(propertyId))
      .select(["id", "monthlyRent", "status"])
      .executeTakeFirst();

    if (!unit) {
      return new Response(
        superjson.stringify({ error: "Unit not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (unit.status !== "available") {
      return new Response(
        superjson.stringify({ error: "Unit is not available for rent" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check no active contract already exists for this unit
    const existing = await db.selectFrom("rentalContracts")
      .where("unitId", "=", Number(unitId))
      .where("contractStatus", "=", "active")
      .select(["id"])
      .executeTakeFirst();

    if (existing) {
      return new Response(
        superjson.stringify({ error: "Unit already has an active rental contract" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a pending application for this unit
    const pendingApp = await db.selectFrom("rentalContracts")
      .where("unitId", "=", Number(unitId))
      .where("tenantUserId", "=", session.user.id)
      .where("contractStatus", "=", "pending")
      .select(["id"])
      .executeTakeFirst();

    if (pendingApp) {
      return new Response(
        superjson.stringify({ error: "You already have a pending application for this unit" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create the rental contract application
    const contract = await db.insertInto("rentalContracts")
      .values({
        propertyId: Number(propertyId),
        unitId: Number(unitId),
        tenantUserId: session.user.id,
        monthlyRent: unit.monthlyRent,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        contractStatus: "pending",
        paymentFrequency: "monthly",
        autoGenerateInvoice: true,
        notes: notes || null,
      })
      .returning(["id"])
      .executeTakeFirst();

    // Mark unit as pending
    await db.updateTable("propertyUnits")
      .set({ status: "pending", updatedAt: new Date() })
      .where("id", "=", Number(unitId))
      .execute();

    // Audit log
    await db.insertInto("rentAuditLogs")
      .values({
        action: "contract_created",
        entityType: "rental_contract",
        entityId: contract!.id,
        userId: session.user.id,
        metadata: { propertyId, unitId, startDate, endDate },
      })
      .execute();

    // Notify property owner/landlord about the application
    const property = await db.selectFrom("properties").where("id", "=", Number(propertyId)).select(["userId", "title"]).executeTakeFirst();
    if (property) {
      await notifyLandlord(property.userId, "tenant_applied", {
        propertyTitle: property.title,
        unitId: Number(unitId),
        tenantId: session.user.id,
      });
    }

    return new Response(
      superjson.stringify({
        success: true,
        contractId: contract!.id,
        message: "Rental application submitted successfully",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: error.message }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("[rent/tenant/apply]", error);
    return new Response(
      superjson.stringify({ error: error.message || "Failed to submit rental application" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
