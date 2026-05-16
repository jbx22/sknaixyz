import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { superjson } from "../../../helpers/schema";
import type { Request } from "express";
import { db } from "../../../helpers/db";

export async function handle(request: Request) {
  try {
    // Public endpoint — no auth required
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const propertyId = url.searchParams.get("propertyId");
    const minRent = url.searchParams.get("minRent");
    const maxRent = url.searchParams.get("maxRent");
    const minBedrooms = url.searchParams.get("minBedrooms");
    const search = url.searchParams.get("search");

    const offset = (page - 1) * limit;

    let query = db
      .selectFrom("propertyUnits")
      .innerJoin("properties", "propertyUnits.propertyId", "properties.id")
      .select([
        "propertyUnits.id",
        "propertyUnits.propertyId",
        "propertyUnits.unitNumber",
        "propertyUnits.floorNumber",
        "propertyUnits.areaSqm",
        "propertyUnits.bedrooms",
        "propertyUnits.bathrooms",
        "propertyUnits.monthlyRent",
        "propertyUnits.status",
        "propertyUnits.description",
      ])
      .where("propertyUnits.status", "=", "available");

    if (propertyId) query = query.where("propertyUnits.propertyId", "=", Number(propertyId));
    if (minRent) query = query.where("propertyUnits.monthlyRent", ">=", Number(minRent));
    if (maxRent) query = query.where("propertyUnits.monthlyRent", "<=", Number(maxRent));
    if (minBedrooms) query = query.where("propertyUnits.bedrooms", ">=", Number(minBedrooms));
    if (search) query = query.where((eb) => eb.or([
      eb("propertyUnits.unitNumber", "ilike", `%${search}%`),
      eb("propertyUnits.description", "ilike", `%${search}%`),
      eb("properties.title", "ilike", `%${search}%`),
      eb("properties.city", "ilike", `%${search}%`),
    ]));

    // Count total
    const countResult = await query
      .select(db.fn.count("propertyUnits.id").as("total"))
      .executeTakeFirst();
    const total = Number(countResult?.total ?? 0);

    // Fetch with property info
    const units = await query
      .clearSelect()
      .select([
        "propertyUnits.id",
        "propertyUnits.propertyId",
        "propertyUnits.unitNumber",
        "propertyUnits.floorNumber",
        "propertyUnits.areaSqm",
        "propertyUnits.bedrooms",
        "propertyUnits.bathrooms",
        "propertyUnits.monthlyRent",
        "propertyUnits.status",
        "propertyUnits.description",
        "properties.title as propertyTitle",
        "properties.city as propertyCity",
      ])
      .orderBy("propertyUnits.monthlyRent", "asc")
      .limit(limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({ units, total, page, limit }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[rent/public/units]", error);
    return new Response(
      superjson.stringify({ error: error.message || "Failed to fetch available units" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
