import { db } from "../../helpers/db";
import { superjson } from "../../helpers/schema";
import type { Request } from "express";

export async function handle(request: Request) {
  try {
    // Public: all active add-on services
    const services = await db
      .selectFrom("serviceCatalog")
      .where("isActive", "=", true)
      .orderBy("id", "asc")
      .selectAll()
      .execute();

    return new Response(
      superjson.stringify({ services }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[services/list]", error);
    return new Response(superjson.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
