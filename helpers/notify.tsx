import { db } from "./db";

type NotificationType = "info" | "warning" | "success" | "rent" | "investment" | "compliance";

interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user.
 * Non-blocking — errors are logged but never thrown.
 */
export async function notify(input: CreateNotificationInput): Promise<void> {
  try {
    await db.insertInto("notifications").values({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || "info",
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || {},
    }).execute();
  } catch (error) {
    console.error("[notify] Failed to create notification:", error);
  }
}

/**
 * Create a notification for multiple users (e.g., all tenants of a property).
 */
export async function notifyMany(users: Array<{ id: number }>, input: Omit<CreateNotificationInput, "userId">): Promise<void> {
  try {
    const values = users.map(u => ({
      userId: u.id,
      title: input.title,
      message: input.message,
      type: input.type || "info",
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || {},
    }));
    // Insert in batches of 50
    for (let i = 0; i < values.length; i += 50) {
      await db.insertInto("notifications").values(values.slice(i, i + 50)).execute();
    }
  } catch (error) {
    console.error("[notifyMany] Failed:", error);
  }
}

/**
 * Notify landlord about a tenant action.
 */
export async function notifyLandlord(landlordId: number, event: string, details: Record<string, any>): Promise<void> {
  const notifications: Record<string, { title: string; message: string; type: NotificationType; actionUrl: string }> = {
    tenant_applied: {
      title: "New Rental Application",
      message: `A tenant has applied to rent your property "${details.propertyTitle || "Property"}".`,
      type: "rent",
      actionUrl: "/rent/manage",
    },
    payment_received: {
      title: "Payment Received",
      message: `Payment of SAR ${details.amount || 0} received for ${details.unitNumber || "unit"}.`,
      type: "success",
      actionUrl: "/admin/rent/invoices",
    },
    invoice_overdue: {
      title: "Overdue Invoice",
      message: `Invoice for ${details.tenantName || "tenant"} is ${details.daysOverdue || 0} days overdue.`,
      type: "warning",
      actionUrl: "/admin/rent/invoices",
    },
    contract_expiring: {
      title: "Contract Expiring Soon",
      message: `Contract with ${details.tenantName || "tenant"} expires in ${details.daysLeft || 0} days.`,
      type: "warning",
      actionUrl: "/admin/rent/contracts",
    },
  };

  const n = notifications[event];
  if (n) {
    await notify({ userId: landlordId, ...n, metadata: details });
  }
}

/**
 * Notify tenant about a landlord/system action.
 */
export async function notifyTenant(tenantId: number, event: string, details: Record<string, any>): Promise<void> {
  const notifications: Record<string, { title: string; message: string; type: NotificationType; actionUrl: string }> = {
    application_approved: {
      title: "Application Approved",
      message: `Your rental application for "${details.propertyTitle || "Property"}" has been approved!`,
      type: "success",
      actionUrl: "/rent/portal",
    },
    application_rejected: {
      title: "Application Update",
      message: `Your rental application for "${details.propertyTitle || "Property"}" was not approved.`,
      type: "info",
      actionUrl: "/rent",
    },
    invoice_generated: {
      title: "New Rent Invoice",
      message: `Rent invoice of SAR ${details.amount || 0} is due by ${details.dueDate || "soon"}.`,
      type: "rent",
      actionUrl: "/rent/portal",
    },
    payment_confirmed: {
      title: "Payment Confirmed",
      message: `Your payment of SAR ${details.amount || 0} has been confirmed. Thank you!`,
      type: "success",
      actionUrl: "/rent/portal",
    },
    payment_reminder: {
      title: "Rent Due Soon",
      message: `Your rent of SAR ${details.amount || 0} is due in ${details.daysLeft || 3} days.`,
      type: "warning",
      actionUrl: "/rent/portal",
    },
    payment_overdue: {
      title: "Rent Overdue",
      message: `Your rent of SAR ${details.amount || 0} is overdue. Please pay as soon as possible.`,
      type: "warning",
      actionUrl: "/rent/portal",
    },
    contract_renewed: {
      title: "Contract Renewed",
      message: `Your rental contract has been renewed until ${details.endDate || "the new period"}.`,
      type: "success",
      actionUrl: "/rent/portal",
    },
    contract_terminating: {
      title: "Contract Ending Soon",
      message: `Your rental contract ends in ${details.daysLeft || 0} days. Please arrange move-out or renewal.`,
      type: "warning",
      actionUrl: "/rent/portal",
    },
  };

  const n = notifications[event];
  if (n) {
    await notify({ userId: tenantId, ...n, metadata: details });
  }
}

/**
 * Notify investor about income/distribution events.
 */
export async function notifyInvestor(investorId: number, event: string, details: Record<string, any>): Promise<void> {
  const notifications: Record<string, { title: string; message: string; type: NotificationType; actionUrl: string }> = {
    distribution_received: {
      title: "Rental Income Distribution",
      message: `SAR ${details.amount || 0} has been distributed from "${details.propertyTitle || "Property"}".`,
      type: "investment",
      actionUrl: "/rent/portal",
    },
    allocation_ready: {
      title: "Income Allocation Ready",
      message: `Rental income for "${details.propertyTitle || "Property"}" has been calculated.`,
      type: "investment",
      actionUrl: "/rent/portal",
    },
  };

  const n = notifications[event];
  if (n) {
    await notify({ userId: investorId, ...n, metadata: details });
  }
}
