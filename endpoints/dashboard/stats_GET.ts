import { OutputType } from "./stats_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session.user) throw new NotAuthenticatedError("Authentication required");

    const role = session.user.role;
    const userId = session.user.id;
    let stats: Record<string, any> = {};

    if (role === "admin" || role === "superadmin") {
      // Admin dashboard stats
      const [userCount, propertyCount, contractCount] = await Promise.all([
        db.selectFrom("users").select((eb) => eb.fn.count("id").as("count")).executeTakeFirst(),
        db.selectFrom("properties").select((eb) => eb.fn.count("id").as("count")).executeTakeFirst(),
        db.selectFrom("rentalContracts").select((eb) => eb.fn.count("id").as("count")).executeTakeFirst(),
      ]);

      const revenueResult = await db
        .selectFrom("rentPayments")
        .select((eb) => eb.fn.sum("amount").as("total"))
        .where("status", "=", "completed")
        .executeTakeFirst();

      const pendingApprovals = await db
        .selectFrom("tokenizationRequests")
        .select((eb) => eb.fn.count("id").as("count"))
        .where("status", "=", "pending")
        .executeTakeFirst();

      stats = {
        totalUsers: Number(userCount?.count ?? 0),
        totalProperties: Number(propertyCount?.count ?? 0),
        totalContracts: Number(contractCount?.count ?? 0),
        totalRevenue: revenueResult?.total ?? "0",
        pendingApprovals: Number(pendingApprovals?.count ?? 0),
      };
    } else if (role === "owner" || role === "developer" || role === "broker") {
      // Owner/developer/broker stats
      const [propertyCount, activeContracts] = await Promise.all([
        db.selectFrom("properties")
          .select((eb) => eb.fn.count("id").as("count"))
          .where("userId", "=", userId)
          .executeTakeFirst(),
        db.selectFrom("rentalContracts")
          .select((eb) => eb.fn.count("id").as("count"))
          .innerJoin("properties", "rentalContracts.propertyId", "properties.id")
          .where("properties.userId", "=", userId)
          .where("rentalContracts.status", "=", "active")
          .executeTakeFirst(),
      ]);

      const incomeResult = await db
        .selectFrom("rentPayments")
        .innerJoin("rentalContracts", "rentPayments.contractId", "rentalContracts.id")
        .innerJoin("properties", "rentalContracts.propertyId", "properties.id")
        .select((eb) => eb.fn.sum("rentPayments.amount").as("total"))
        .where("properties.userId", "=", userId)
        .where("rentPayments.status", "=", "completed")
        .executeTakeFirst();

      const pendingInvoices = await db
        .selectFrom("rentInvoices")
        .innerJoin("rentalContracts", "rentInvoices.contractId", "rentalContracts.id")
        .innerJoin("properties", "rentalContracts.propertyId", "properties.id")
        .select((eb) => eb.fn.count("rentInvoices.id").as("count"))
        .where("properties.userId", "=", userId)
        .where("rentInvoices.status", "=", "pending")
        .executeTakeFirst();

      const rentedCount = await db
        .selectFrom("properties")
        .select((eb) => eb.fn.count("id").as("count"))
        .where("userId", "=", userId)
        .where("status", "=", "rented")
        .executeTakeFirst();

      const totalProps = Number(propertyCount?.count ?? 0);
      const rented = Number(rentedCount?.count ?? 0);

      stats = {
        totalProperties: totalProps,
        activeContracts: Number(activeContracts?.count ?? 0),
        occupancyRate: totalProps > 0 ? Math.round((rented / totalProps) * 100) : 0,
        totalIncome: incomeResult?.total ?? "0",
        pendingInvoices: Number(pendingInvoices?.count ?? 0),
      };
    } else if (role === "investor") {
      // Investor stats
      const holdings = await db
        .selectFrom("tokenHoldings")
        .select((eb) => [
          eb.fn.count("id").as("count"),
          eb.fn.sum("amount").as("totalValue"),
        ])
        .where("userId", "=", userId)
        .executeTakeFirst();

      const distributions = await db
        .selectFrom("investorDistributions")
        .select((eb) => eb.fn.sum("amount").as("total"))
        .where("userId", "=", userId)
        .where("status", "=", "completed")
        .executeTakeFirst();

      stats = {
        portfolioValue: holdings?.totalValue ?? "0",
        totalHoldings: Number(holdings?.count ?? 0),
        incomeReceived: distributions?.total ?? "0",
        totalDistributions: Number(holdings?.count ?? 0),
      };
    } else {
      // Regular user / tenant stats
      const [contracts, invoices, payments, favorites] = await Promise.all([
        db.selectFrom("rentalContracts")
          .select((eb) => eb.fn.count("id").as("count"))
          .where("tenantId", "=", userId)
          .executeTakeFirst(),
        db.selectFrom("rentInvoices")
          .select((eb) => eb.fn.count("id").as("count"))
          .innerJoin("rentalContracts", "rentInvoices.contractId", "rentalContracts.id")
          .where("rentalContracts.tenantId", "=", userId)
          .executeTakeFirst(),
        db.selectFrom("rentPayments")
          .select((eb) => eb.fn.count("id").as("count"))
          .innerJoin("rentalContracts", "rentPayments.contractId", "rentalContracts.id")
          .where("rentalContracts.tenantId", "=", userId)
          .executeTakeFirst(),
        db.selectFrom("userFavorites")
          .select((eb) => eb.fn.count("id").as("count"))
          .where("userId", "=", userId)
          .executeTakeFirst(),
      ]);

      stats = {
        totalContracts: Number(contracts?.count ?? 0),
        totalInvoices: Number(invoices?.count ?? 0),
        totalPayments: Number(payments?.count ?? 0),
        favoritesCount: Number(favorites?.count ?? 0),
      };
    }

    return new Response(
      superjson.stringify({ role, stats } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: error.message }), { status: 401 });
    }
    console.error("[dashboard-stats]", error);
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}
