import { db } from "../../helpers/db";
import superjson from "superjson";
import { notifyTenant, notifyLandlord } from "../../helpers/notify";

export async function handle(request: Request) {
  try {
    // Auth: must be called with cron secret or by Vercel cron system
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "sknai-cron-2024";
    const isVercelCron = request.headers.get("x-vercel-cron") === "true";
    if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const results = { overdue: 0, reminders: 0, expiring: 0 };

    // 1. Mark overdue invoices (due date passed, still pending)
    const overdueInvoices = await db
      .selectFrom("rentInvoices")
      .innerJoin("rentalContracts", "rentalContracts.id", "rentInvoices.contractId")
      .innerJoin("properties", "properties.id", "rentInvoices.propertyId")
      .where("rentInvoices.invoiceStatus", "=", "pending")
      .where("rentInvoices.dueDate", "<", new Date())
      .select([
        "rentInvoices.id as invoiceId", "rentInvoices.amount", "rentInvoices.tenantUserId",
        "rentInvoices.dueDate", "rentInvoices.contractId",
        "rentalContracts.landlordUserId",
        "properties.title as propertyTitle",
      ])
      .execute();

    for (const inv of overdueInvoices) {
      const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      await db.updateTable("rentInvoices")
        .set({ invoiceStatus: "overdue", updatedAt: new Date() })
        .where("id", "=", inv.invoiceId)
        .execute();

      // Notify tenant
      await notifyTenant(inv.tenantUserId, "payment_overdue", {
        amount: inv.amount,
        daysOverdue,
        invoiceId: inv.invoiceId,
      });

      // Notify landlord (only if > 1 day overdue to avoid spam)
      if (daysOverdue >= 1) {
        await notifyLandlord(inv.landlordUserId, "invoice_overdue", {
          tenantId: inv.tenantUserId,
          daysOverdue,
          amount: inv.amount,
        });
      }

      results.overdue++;
    }

    // 2. Upcoming due reminders (invoices due in 3-5 days, still pending)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    const upcomingInvoices = await db
      .selectFrom("rentInvoices")
      .where("rentInvoices.invoiceStatus", "=", "pending")
      .where("rentInvoices.dueDate", "<=", fiveDaysFromNow)
      .where("rentInvoices.dueDate", ">", new Date())
      .select(["rentInvoices.id as invoiceId", "rentInvoices.amount", "rentInvoices.tenantUserId", "rentInvoices.dueDate", "rentInvoices.contractId"])
      .execute();

    for (const inv of upcomingInvoices) {
      const daysLeft = Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Check if we already sent a reminder for this invoice recently
      const existingReminder = await db
        .selectFrom("rentReminders")
        .where("invoiceId", "=", inv.invoiceId)
        .where("createdAt", ">", new Date(Date.now() - 24 * 60 * 60 * 1000)) // last 24h
        .select(["id"])
        .executeTakeFirst();

      if (!existingReminder) {
        await notifyTenant(inv.tenantUserId, "payment_reminder", {
          amount: inv.amount,
          daysLeft,
          invoiceId: inv.invoiceId,
        });

        // Log the reminder
        await db.insertInto("rentReminders").values({
          invoiceId: inv.invoiceId,
          contractId: inv.contractId,
          reminderType: `due_in_${daysLeft}_days`,
          sentAt: new Date(),
          deliveryStatus: "sent",
        }).execute();

        results.reminders++;
      }
    }

    // 3. Expiring contracts (ending in 30, 14, or 7 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = await db
      .selectFrom("rentalContracts")
      .innerJoin("properties", "properties.id", "rentalContracts.propertyId")
      .where("rentalContracts.contractStatus", "=", "active")
      .where("rentalContracts.endDate", "<=", thirtyDaysFromNow)
      .where("rentalContracts.endDate", ">", new Date())
      .select([
        "rentalContracts.id as contractId", "rentalContracts.tenantUserId",
        "rentalContracts.landlordUserId", "rentalContracts.endDate",
        "properties.title as propertyTitle",
      ])
      .execute();

    for (const c of expiringContracts) {
      const daysLeft = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Only notify at 30, 14, and 7 day marks (within 1-day tolerance)
      if ([30, 29, 14, 13, 7, 6].includes(daysLeft)) {
        await notifyTenant(c.tenantUserId, "contract_terminating", {
          daysLeft,
          propertyTitle: c.propertyTitle,
          contractId: c.contractId,
        });

        await notifyLandlord(c.landlordUserId, "contract_expiring", {
          daysLeft,
          tenantName: "tenant",
          propertyTitle: c.propertyTitle,
          contractId: c.contractId,
        });

        results.expiring++;
      }
    }

    return new Response(
      superjson.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[cron/rent-checks]", error);
    return new Response(
      superjson.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
