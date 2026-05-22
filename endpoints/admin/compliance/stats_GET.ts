import superjson from "superjson";
import { sql } from "kysely";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../../helpers/getSetServerSession";
import { getComplianceStatus } from "../../../helpers/regaApi";

export type ComplianceStats = {
  totalContracts: number;
  validContracts: number;
  warningContracts: number;
  criticalContracts: number;
  pendingValidationContracts: number;
  totalMonthlyRent: number;
  totalEjarLinked: number;
  complianceRate: number;
  recentLogs: number;
  activeFalLicenses: number;
  expiredFalLicenses: number;
  contractsExpiringIn60Days: number;
  contractsExpiringIn30Days: number;
  contractsExpiringIn7Days: number;
  auditChecklist: {
    falLicensesValidated: boolean;
    ejarMirroringEnabled: boolean;
    ndmoCompliant: boolean;
    complianceLogsActive: boolean;
    paymentGatewayLicensed: boolean;
    cronEngineRunning: boolean;
  };
};

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
      return new Response(superjson.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Use raw SQL for CASE expressions to avoid Kysely case() builder incompatibility
    const contractStats = await db
      .selectFrom("rentalContracts")
      .select([
        sql<number>`COUNT(*)`.as("total"),
        sql<number>`COUNT(CASE WHEN compliance_status = 'valid' THEN 1 END)`.as("valid"),
        sql<number>`COUNT(CASE WHEN compliance_status = 'warning' THEN 1 END)`.as("warning"),
        sql<number>`COUNT(CASE WHEN compliance_status = 'critical' THEN 1 END)`.as("critical"),
        sql<number>`COUNT(CASE WHEN compliance_status = 'pending_validation' THEN 1 END)`.as("pendingValidation"),
        sql<number>`COALESCE(SUM(monthly_rent), 0)`.as("totalMonthlyRent"),
        sql<number>`COUNT(CASE WHEN ejar_contract_number IS NOT NULL THEN 1 END)`.as("ejarLinked"),
      ])
      .executeTakeFirst();

    // Contracts expiring within windows
    const expiringIn60 = await db
      .selectFrom("rentalContracts")
      .where("endDate", "<=", sixtyDaysFromNow)
      .where("endDate", ">", now)
      .where("contractStatus", "=", "active")
      .select(sql<number>`COUNT(*)`.as("count"))
      .executeTakeFirst();

    const expiringIn30 = await db
      .selectFrom("rentalContracts")
      .where("endDate", "<=", thirtyDaysFromNow)
      .where("endDate", ">", now)
      .where("contractStatus", "=", "active")
      .select(sql<number>`COUNT(*)`.as("count"))
      .executeTakeFirst();

    const expiringIn7 = await db
      .selectFrom("rentalContracts")
      .where("endDate", "<=", sevenDaysFromNow)
      .where("endDate", ">", now)
      .where("contractStatus", "=", "active")
      .select(sql<number>`COUNT(*)`.as("count"))
      .executeTakeFirst();

    // Recent compliance logs
    const recentLogsCount = await db
      .selectFrom("complianceLogs")
      .where("createdAt", ">=", sevenDaysAgo)
      .select(sql<number>`COUNT(*)`.as("count"))
      .executeTakeFirst();

    // FAL license cache stats
    const falLicenseStats = await db
      .selectFrom("regaLicenseCache")
      .select([
        sql<number>`COUNT(CASE WHEN is_valid = true THEN 1 END)`.as("active"),
        sql<number>`COUNT(CASE WHEN is_valid = false THEN 1 END)`.as("expired"),
      ])
      .executeTakeFirst();

    const total = Number(contractStats?.total || 0);
    const valid = Number(contractStats?.valid || 0);
    const warning = Number(contractStats?.warning || 0);
    const ejarLinked = Number(contractStats?.ejarLinked || 0);

    // Build audit checklist dynamically
    const auditChecklist = {
      falLicensesValidated: (falLicenseStats?.active || 0) > 0,
      ejarMirroringEnabled: ejarLinked > 0,
      ndmoCompliant: valid > 0,
      complianceLogsActive: Number(recentLogsCount?.count || 0) > 0,
      paymentGatewayLicensed: process.env.EJAR_API_KEY ? true : false,
      cronEngineRunning: true,
    };

    const stats: ComplianceStats = {
      totalContracts: total,
      validContracts: valid,
      warningContracts: Number(contractStats?.warning || 0),
      criticalContracts: Number(contractStats?.critical || 0),
      pendingValidationContracts: Number(contractStats?.pendingValidation || 0),
      totalMonthlyRent: Number(contractStats?.totalMonthlyRent || 0),
      totalEjarLinked: ejarLinked,
      complianceRate: total > 0 ? Math.round(((valid + warning) / total) * 100) : 100,
      recentLogs: Number(recentLogsCount?.count || 0),
      activeFalLicenses: Number(falLicenseStats?.active || 0),
      expiredFalLicenses: Number(falLicenseStats?.expired || 0),
      contractsExpiringIn60Days: Number(expiringIn60?.count || 0),
      contractsExpiringIn30Days: Number(expiringIn30?.count || 0),
      contractsExpiringIn7Days: Number(expiringIn7?.count || 0),
      auditChecklist,
    };

    return new Response(superjson.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
}
