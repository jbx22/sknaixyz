import { db } from "./db";
import { AdminActivityLogs } from "./schema";
import { Selectable } from "kysely";

type AdminActivityLogInput = {
  adminId: number;
  actionType: string;
  targetType: string | null;
  targetId: number | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
};

/**
 * Logs an admin activity to the database.
 * This function should be called whenever an admin performs a write operation.
 * It does not throw errors to prevent blocking the main operation if logging fails,
 * but it logs the error to the console.
 */
export async function logAdminActivity(
  input: AdminActivityLogInput
): Promise<void> {
  try {
    await db
      .insertInto("adminActivityLogs")
      .values({
        adminId: input.adminId,
        actionType: input.actionType,
        targetType: input.targetType,
        targetId: input.targetId,
        details: input.details ? JSON.stringify(input.details) : null,
        ipAddress: input.ipAddress,
        createdAt: new Date(),
      })
      .execute();
  } catch (error) {
    console.error("Failed to log admin activity:", error);
    // We intentionally do not re-throw here to avoid failing the main request
    // just because logging failed.
  }
}