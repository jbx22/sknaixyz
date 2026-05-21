import { db } from "../../helpers/db";
import superjson from "superjson";
import { notifyTenant, notifyLandlord } from "../../helpers/notify";
import { sendSmsNotification, getComplianceSmsTemplates } from "../../helpers/smsGateway";
import { logComplianceEvent, getComplianceStatus } from "../../helpers/regaApi";

export async function handle(request: Request) {
  try {
    // Auth: must be called with cron secret or by Vercel cron system
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "sknai-cron-2024";
    const isVercelCron = request.headers.get("x-vercel-cron") === "true";
    if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const smsTemplates = getComplianceSmsTemplates();
    const results = { overdue: 0, reminders: 0, expiring: 0, complianceNotices: 0, smsSent: 0, complianceUpdated: 0 };

    // ──────────────────────────────────────────────
    // 1. REGA 60-DAY COMPLIANCE WINDOW SCAN
    // ──────────────────────────────────────────────
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Check all active contracts for 60-day, 30-day, and 7-day windows
    const activeContracts = await db
      .selectFrom("rentalContracts")
      .innerJoin("properties", "properties.id", "rentalContracts.propertyId")
      .where("rentalContracts.contractStatus", "=", "active")
      .select([
        "rentalContracts.id as contractId",
        "rentalContracts.ejarContractNumber",
        "rentalContracts.tenantUserId",
        "rentalContracts.landlordUserId",
        "rentalContracts.endDate",
        "rentalContracts.startDate",
        "rentalContracts.monthlyRent",
        "rentalContracts.autoRenewFlag",
        "rentalContracts.complianceStatus",
        "properties.title as propertyTitle",
        "properties.contactPhone as phone",
      ])
      .execute();

    // Also get tenant/landlord phone numbers
    const userIds = [...new Set(activeContracts.flatMap(c => [c.tenantUserId, c.landlordUserId]))];
    const userPhones = userIds.length > 0 ? await db
      .selectFrom("users")
      .where("id", "in", userIds)
      .select(["id", "phone"])
      .execute() : [];

    const phoneMap = new Map(userPhones.map(u => [Number(u.id), String(u.phone || "")]));

    for (const c of activeContracts) {
      const endDate = new Date(c.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const newComplianceStatus = getComplianceStatus(endDate);

      // Update compliance status if changed
      if (c.complianceStatus !== newComplianceStatus) {
        await db.updateTable("rentalContracts")
          .set({
            complianceStatus: newComplianceStatus,
            lastComplianceCheck: now,
            updatedAt: now,
          })
          .where("id", "=", c.contractId)
          .execute();
        results.complianceUpdated++;

        // Log compliance status change
        await logComplianceEvent(
          c.contractId,
          `compliance_status_${newComplianceStatus}`,
          `تغيرت حالة الامتثال للعقد ${c.ejarContractNumber || c.contractId} إلى ${newComplianceStatus}`,
          { daysLeft, autoRenew: c.autoRenewFlag, propertyTitle: c.propertyTitle }
        );
      }

      // ── 60-Day Notice (warning contracts with auto-renew) ──
      const noticeDays = [60, 59, 58, 57, 56, 55, 45, 30, 29, 14, 13, 7, 6];
      if (noticeDays.includes(daysLeft) && newComplianceStatus !== "critical") {
        const tenantPhone = phoneMap.get(Number(c.tenantUserId)) || "";

        if (c.autoRenewFlag) {
          // Send REGA 60-day compliance notice for auto-renewing contracts
          await logComplianceEvent(
            c.contractId,
            "60_DAY_COMPLIANCE_NOTICE",
            `تم إرسال إشعار 60 يوم للعقد ${c.ejarContractNumber || c.contractId} — سيتم التجديد التلقائي`,
            { daysLeft, propertyTitle: c.propertyTitle }
          );
          results.complianceNotices++;

          // SMS notification to tenant
          if (tenantPhone) {
            const smsMsg = smsTemplates.sixtyDayNotice(
              c.ejarContractNumber || String(c.contractId),
              daysLeft,
              c.propertyTitle
            );
            const smsResult = await sendSmsNotification(tenantPhone, smsMsg);
            if (smsResult.success) results.smsSent++;
          }

          // In-app notification to tenant
          await notifyTenant(c.tenantUserId, "contract_compliance_60day", {
            daysLeft,
            propertyTitle: c.propertyTitle,
            contractId: c.contractId,
            autoRenew: true,
            ejarContractNumber: c.ejarContractNumber,
          });
        }

        // Also notify landlord
        await notifyLandlord(c.landlordUserId, "contract_compliance_60day", {
          daysLeft,
          propertyTitle: c.propertyTitle,
          contractId: c.contractId,
          tenantName: "tenant",
          autoRenew: c.autoRenewFlag,
        });
      }

      // ── Standard expiring notifications (30, 14, 7 day marks) ──
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

      // ── Ejar mirror update for linked contracts ──
      if (daysLeft <= 60 && c.ejarContractNumber) {
        const nextComplianceDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await db.updateTable("rentalContracts")
          .set({ nextComplianceDue })
          .where("id", "=", c.contractId)
          .execute();
      }
    }

    // ──────────────────────────────────────────────
    // 2. Mark overdue invoices
    // ──────────────────────────────────────────────
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
        "rentalContracts.ejarContractNumber",
      ])
      .execute();

    for (const inv of overdueInvoices) {
      const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      await db.updateTable("rentInvoices")
        .set({ invoiceStatus: "overdue", updatedAt: new Date() })
        .where("id", "=", inv.invoiceId)
        .execute();

      await notifyTenant(inv.tenantUserId, "payment_overdue", {
        amount: inv.amount,
        daysOverdue,
        invoiceId: inv.invoiceId,
      });
      results.overdue++;

      // SMS for payment overdue (over 7 days)
      if (daysOverdue >= 7) {
        const tenantPhone = phoneMap.get(Number(inv.tenantUserId)) || "";
        if (tenantPhone) {
          const smsMsg = smsTemplates.paymentOverdue(Number(inv.amount), daysOverdue, inv.ejarContractNumber || String(inv.contractId));
          const smsResult = await sendSmsNotification(tenantPhone, smsMsg);
          if (smsResult.success) results.smsSent++;
        }
      }

      if (daysOverdue >= 1) {
        await notifyLandlord(inv.landlordUserId, "invoice_overdue", {
          tenantId: inv.tenantUserId,
          daysOverdue,
          amount: inv.amount,
        });
      }
    }

    // ──────────────────────────────────────────────
    // 3. Upcoming due reminders (invoices due in 3-5 days)
    // ──────────────────────────────────────────────
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

      const existingReminder = await db
        .selectFrom("rentReminders")
        .where("invoiceId", "=", inv.invoiceId)
        .where("createdAt", ">", new Date(Date.now() - 24 * 60 * 60 * 1000))
        .select(["id"])
        .executeTakeFirst();

      if (!existingReminder) {
        await notifyTenant(inv.tenantUserId, "payment_reminder", {
          amount: inv.amount,
          daysLeft,
          invoiceId: inv.invoiceId,
        });

        await db.insertInto("rentReminders").values({
          invoiceId: inv.invoiceId,
          contractId: inv.contractId,
          reminderType: `due_in_${daysLeft}_days`,
          sentAt: new Date(),
          deliveryStatus: "sent",
        } as any).execute();

        results.reminders++;
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
