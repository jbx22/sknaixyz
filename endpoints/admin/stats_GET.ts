import { schema, OutputType } from "./stats_GET.schema";
import superjson from "superjson";
import { db, hasDatabaseUrl } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    if (!hasDatabaseUrl()) {
      const demoStats: OutputType = {
        totalUsers: 6,
        totalProperties: 0,
        subscriptionsByTier: [
          { tier: "free", count: 1 },
          { tier: "basic", count: 0 },
          { tier: "premium", count: 5 },
        ],
        recentActivity: [
          { id: 1, action: "DEMO_MODE", adminName: session.user.displayName, createdAt: new Date() },
        ],
        totalRevenue: 0,
      };
      return new Response(superjson.stringify(demoStats));
    }

    // Execute queries in parallel for performance
    const [
      usersCount,
      propertiesCount,
      subscriptionsByTier,
      recentActivity,
      revenueStats
    ] = await Promise.all([
      // Total users
      db.selectFrom("users").select((eb) => eb.fn.count("id").as("count")).executeTakeFirst(),
      
      // Total properties
      db.selectFrom("properties").select((eb) => eb.fn.count("id").as("count")).executeTakeFirst(),
      
      // Subscriptions by tier
      db.selectFrom("users")
        .select(["subscriptionTier", (eb) => eb.fn.count("id").as("count")])
        .groupBy("subscriptionTier")
        .execute(),
        
      // Recent activity (last 5 logs)
      db.selectFrom("adminActivityLogs")
        .innerJoin("users", "adminActivityLogs.adminId", "users.id")
        .select([
          "adminActivityLogs.id",
          "adminActivityLogs.actionType",
          "adminActivityLogs.createdAt",
          "users.displayName as adminName"
        ])
        .orderBy("adminActivityLogs.createdAt", "desc")
        .limit(5)
        .execute(),

      // Revenue stats (sum of completed payments)
      db.selectFrom("subscriptionPayments")
        .where("paymentStatus", "=", "completed")
        .select((eb) => eb.fn.sum("amount").as("totalRevenue"))
        .executeTakeFirst()
    ]);

    const stats: OutputType = {
      totalUsers: Number(usersCount?.count ?? 0),
      totalProperties: Number(propertiesCount?.count ?? 0),
      subscriptionsByTier: subscriptionsByTier.map(s => ({
        tier: s.subscriptionTier,
        count: Number(s.count)
      })),
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        action: a.actionType,
        adminName: a.adminName,
        createdAt: a.createdAt
      })),
      totalRevenue: Number(revenueStats?.totalRevenue ?? 0)
    };

    return new Response(superjson.stringify(stats));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}
