import { eq, and, gte, lt, lte } from 'drizzle-orm';
import { payments, leases, units, properties, tenants } from '../../drizzle/schema';
import { getDb } from '../db';
import {
  sendRentReminder,
  sendOverdueAlert,
  validatePhoneNumber,
  formatPhoneNumber,
} from './smsNotificationService';

interface SchedulerConfig {
  rentReminderDaysBefore?: number; // Days before rent due to send reminder (default: 3)
  overdueCheckInterval?: number; // Hours between overdue checks (default: 24)
  overdueAlertAfterDays?: number; // Days after due date to send alert (default: 1)
}

const DEFAULT_CONFIG: SchedulerConfig = {
  rentReminderDaysBefore: 3,
  overdueCheckInterval: 24,
  overdueAlertAfterDays: 1,
};

/**
 * Send rent reminders for upcoming payments
 */
export async function sendRentReminders(config: SchedulerConfig = DEFAULT_CONFIG): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  try {
    const daysBeforeDue = config.rentReminderDaysBefore || 3;
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + daysBeforeDue);
    reminderDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(reminderDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get payments due in the next N days
    const upcomingPayments = await db
      .select({
        payment: payments,
        lease: leases,
        unit: units,
        property: properties,
        tenant: tenants,
      })
      .from(payments)
      .innerJoin(leases, eq(payments.leaseId, leases.id))
      .innerJoin(units, eq(payments.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .where(
        and(
          eq(payments.status, 'pending'),
          gte(payments.dueDate, reminderDate),
          lt(payments.dueDate, nextDay)
        )
      );

    console.log(`Found ${upcomingPayments.length} payments due for reminders`);

    // Send SMS to each tenant
    for (const record of upcomingPayments) {
      try {
        const phoneNumber = record.tenant.phone;

        if (!phoneNumber) {
          console.warn(
            `No phone number for tenant ${record.tenant.id} (${record.tenant.firstName})`
          );
          continue;
        }

        if (!validatePhoneNumber(phoneNumber)) {
          console.warn(
            `Invalid phone number for tenant ${record.tenant.id}: ${phoneNumber}`
          );
          continue;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);
        const tenantName = `${record.tenant.firstName} ${record.tenant.lastName}`;

        await sendRentReminder({
          tenantPhoneNumber: formattedPhone,
          tenantName,
          propertyName: record.property.name,
          unitNumber: record.unit.unitNumber,
          rentAmount: Number(record.payment.amount),
          dueDate: record.payment.dueDate,
          currency: 'ZAR',
        });

        console.log(`Sent rent reminder SMS to ${formattedPhone}`);
      } catch (error) {
        console.error('Error sending rent reminder:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendRentReminders:', error);
  }
}

/**
 * Send overdue payment alerts
 */
export async function sendOverdueAlerts(config: SchedulerConfig = DEFAULT_CONFIG): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  try {
    const daysOverdue = config.overdueAlertAfterDays || 1;
    const today = new Date();
    const overdueDate = new Date(today);
    overdueDate.setDate(overdueDate.getDate() - daysOverdue);
    overdueDate.setHours(0, 0, 0, 0);

    // Get overdue payments
    const overduePayments = await db
      .select({
        payment: payments,
        lease: leases,
        unit: units,
        property: properties,
        tenant: tenants,
      })
      .from(payments)
      .innerJoin(leases, eq(payments.leaseId, leases.id))
      .innerJoin(units, eq(payments.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .where(
        and(
          eq(payments.status, 'pending'),
          lte(payments.dueDate, overdueDate)
        )
      );

    console.log(`Found ${overduePayments.length} overdue payments for alerts`);

    // Send SMS to each tenant
    for (const record of overduePayments) {
      try {
        const phoneNumber = record.tenant.phone;

        if (!phoneNumber) {
          console.warn(
            `No phone number for tenant ${record.tenant.id} (${record.tenant.firstName})`
          );
          continue;
        }

        if (!validatePhoneNumber(phoneNumber)) {
          console.warn(
            `Invalid phone number for tenant ${record.tenant.id}: ${phoneNumber}`
          );
          continue;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);
        const tenantName = `${record.tenant.firstName} ${record.tenant.lastName}`;

        // Calculate days overdue
        const daysOverdueCalc = Math.floor(
          (today.getTime() - new Date(record.payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        await sendOverdueAlert({
          tenantPhoneNumber: formattedPhone,
          tenantName,
          propertyName: record.property.name,
          unitNumber: record.unit.unitNumber,
          overdueAmount: Number(record.payment.amount),
          daysOverdue: daysOverdueCalc,
          currency: 'ZAR',
        });

        console.log(`Sent overdue alert SMS to ${formattedPhone}`);
      } catch (error) {
        console.error('Error sending overdue alert:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendOverdueAlerts:', error);
  }
}

/**
 * Run SMS scheduler (typically called by a cron job)
 */
export async function runSMSScheduler(config: SchedulerConfig = DEFAULT_CONFIG): Promise<void> {
  console.log('Running SMS scheduler...');

  // Send rent reminders
  await sendRentReminders(config);

  // Send overdue alerts
  await sendOverdueAlerts(config);

  console.log('SMS scheduler completed');
}

export default {
  sendRentReminders,
  sendOverdueAlerts,
  runSMSScheduler,
};
