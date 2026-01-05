import cron from "node-cron";
import { eq, and, lt, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { payments, leases, tenants, users, properties } from "../../drizzle/schema";
import { sendEmail, emailTemplates, sendBulkEmails } from "./emailService";
import { sendSMS, smsTemplates, sendBulkSMS, formatPhoneNumber } from "./smsService";

let schedulerRunning = false;

export async function startNotificationScheduler() {
  if (schedulerRunning) {
    console.log("[Scheduler] Notification scheduler already running");
    return;
  }

  schedulerRunning = true;
  console.log("[Scheduler] Starting notification scheduler");

  // Run daily at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] Running daily notification checks");
    await checkOverdueRents();
    await checkLeaseExpirations();
  });

  // Run every 6 hours for real-time checks
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Scheduler] Running periodic notification checks");
    await checkOverdueRents();
  });
}

async function checkOverdueRents() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available");
      return;
    }

    const today = new Date();

    // Find overdue payments (7, 14, 30 days)
    const overduePayments = await db
      .select({
        payment: payments,
        lease: leases,
        tenant: tenants,
        property: properties,
      })
      .from(payments)
      .innerJoin(leases, eq(payments.leaseId, leases.id))
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .innerJoin(properties, eq(leases.unitId, properties.id))
      .where(
        and(
          eq(payments.status, "pending" as any),
          lt(payments.dueDate, today),
          lte(payments.dueDate, new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
        )
      );

    const emailsToSend: Array<{ email: string; template: any }> = [];
    const smssToSend: Array<{ phoneNumber: string; template: any }> = [];

    for (const record of overduePayments) {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(record.payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send notifications every 7, 14, and 30 days
      if (daysOverdue === 7 || daysOverdue === 14 || daysOverdue === 30) {
        if (record.tenant.email) {
          const emailTemplate = emailTemplates.overdueRent(
            record.tenant.firstName || "Tenant",
            record.property.name,
            parseFloat(record.payment.amount.toString()),
            daysOverdue
          );

          emailsToSend.push({
            email: record.tenant.email,
            template: emailTemplate,
          });
        }

        // Send SMS if phone number is available
        if (record.tenant.phone) {
          const smsTemplate = smsTemplates.overdueRent(
            record.tenant.firstName || "Tenant",
            record.property.name,
            parseFloat(record.payment.amount.toString()),
            daysOverdue
          );

          smssToSend.push({
            phoneNumber: formatPhoneNumber(record.tenant.phone),
            template: smsTemplate,
          });
        }
      }
    }

    if (emailsToSend.length > 0) {
      const sent = await sendBulkEmails(emailsToSend, { delayMs: 500 });
      console.log(`[Scheduler] Sent ${sent} overdue rent email notifications`);
    }

    if (smssToSend.length > 0) {
      const sent = await sendBulkSMS(smssToSend, { delayMs: 500 });
      console.log(`[Scheduler] Sent ${sent} overdue rent SMS notifications`);
    }
  } catch (error) {
    console.error("[Scheduler] Error checking overdue rents:", error);
  }
}

async function checkLeaseExpirations() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Scheduler] Database not available");
      return;
    }

    const today = new Date();

    // Find leases expiring in 7, 14, or 30 days
    const expiringLeases = await db
      .select({
        lease: leases,
        tenant: tenants,
        property: properties,
      })
      .from(leases)
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .innerJoin(properties, eq(leases.unitId, properties.id))
      .where(
        and(
          gte(leases.endDate, today),
          lte(leases.endDate, new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000))
        )
      );

    const emailsToSend: Array<{ email: string; template: any }> = [];
    const smssToSend: Array<{ phoneNumber: string; template: any }> = [];

    for (const record of expiringLeases) {
      const daysUntilExpiration = Math.floor(
        (new Date(record.lease.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send notifications 30, 14, and 7 days before expiration
      if (daysUntilExpiration === 30 || daysUntilExpiration === 14 || daysUntilExpiration === 7) {
        if (record.tenant.email) {
          const emailTemplate = emailTemplates.leaseExpiration(
            record.tenant.firstName || "Tenant",
            record.property.name,
            new Date(record.lease.endDate).toLocaleDateString(),
            daysUntilExpiration
          );

          emailsToSend.push({
            email: record.tenant.email,
            template: emailTemplate,
          });
        }

        // Send SMS if phone number is available
        if (record.tenant.phone) {
          const smsTemplate = smsTemplates.leaseExpiration(
            record.tenant.firstName || "Tenant",
            record.property.name,
            daysUntilExpiration
          );

          smssToSend.push({
            phoneNumber: formatPhoneNumber(record.tenant.phone),
            template: smsTemplate,
          });
        }
      }
    }

    if (emailsToSend.length > 0) {
      const sent = await sendBulkEmails(emailsToSend, { delayMs: 500 });
      console.log(`[Scheduler] Sent ${sent} lease expiration email notifications`);
    }

    if (smssToSend.length > 0) {
      const sent = await sendBulkSMS(smssToSend, { delayMs: 500 });
      console.log(`[Scheduler] Sent ${sent} lease expiration SMS notifications`);
    }
  } catch (error) {
    console.error("[Scheduler] Error checking lease expirations:", error);
  }
}

export function stopNotificationScheduler() {
  schedulerRunning = false;
  cron.getTasks().forEach(task => task.stop());
  console.log("[Scheduler] Notification scheduler stopped");
}
