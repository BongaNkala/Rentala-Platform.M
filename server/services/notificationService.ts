import { notifyOwner } from '../_core/notification';
import { getDb } from '../db';
import { payments, leases, tenants, properties, units } from '../../drizzle/schema';
import { eq, and, lt, gt } from 'drizzle-orm';

interface NotificationPayload {
  type: 'overdue_payment' | 'upcoming_rent' | 'lease_expiring' | 'maintenance_complete';
  recipientEmail: string;
  recipientPhone?: string;
  tenantName: string;
  propertyName: string;
  unitNumber?: string;
  amount?: number;
  daysOverdue?: number;
  daysUntilDue?: number;
  daysUntilExpiry?: number;
  customMessage?: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

interface SMSTemplate {
  message: string;
}

/**
 * Generate email template for overdue payment notification
 */
export function generateOverduePaymentEmail(data: NotificationPayload): EmailTemplate {
  return {
    subject: `⚠️ Overdue Rent Payment - ${data.propertyName} Unit ${data.unitNumber}`,
    body: `
Dear ${data.tenantName},

This is a reminder that your rent payment for ${data.propertyName} (Unit ${data.unitNumber}) is now OVERDUE.

**Payment Details:**
- Amount Due: R ${Number(data.amount || 0).toLocaleString()}
- Days Overdue: ${data.daysOverdue} days
- Property: ${data.propertyName}
- Unit: ${data.unitNumber}

Please arrange payment immediately to avoid further action. You can pay online through our portal or contact your landlord directly.

If you have already made this payment, please disregard this notice.

Best regards,
Rentala Property Management
    `,
  };
}

/**
 * Generate email template for upcoming rent due notification
 */
export function generateUpcomingRentEmail(data: NotificationPayload): EmailTemplate {
  return {
    subject: `📅 Rent Due Soon - ${data.propertyName} Unit ${data.unitNumber}`,
    body: `
Dear ${data.tenantName},

This is a friendly reminder that your rent payment is due soon.

**Payment Details:**
- Amount Due: R ${Number(data.amount || 0).toLocaleString()}
- Days Until Due: ${data.daysUntilDue} days
- Property: ${data.propertyName}
- Unit: ${data.unitNumber}

Please ensure payment is made by the due date. You can pay online through our portal or contact your landlord for alternative payment methods.

Best regards,
Rentala Property Management
    `,
  };
}

/**
 * Generate email template for lease expiration notification
 */
export function generateLeaseExpiringEmail(data: NotificationPayload): EmailTemplate {
  return {
    subject: `📋 Lease Expiration Notice - ${data.propertyName} Unit ${data.unitNumber}`,
    body: `
Dear ${data.tenantName},

Your lease for ${data.propertyName} (Unit ${data.unitNumber}) is expiring soon.

**Lease Details:**
- Days Until Expiration: ${data.daysUntilExpiry} days
- Property: ${data.propertyName}
- Unit: ${data.unitNumber}

Please contact your landlord to discuss lease renewal options or make arrangements for your move-out.

Best regards,
Rentala Property Management
    `,
  };
}

/**
 * Generate SMS template for overdue payment notification
 */
export function generateOverduePaymentSMS(data: NotificationPayload): SMSTemplate {
  return {
    message: `⚠️ URGENT: Your rent payment for ${data.propertyName} Unit ${data.unitNumber} is ${data.daysOverdue} days overdue. Amount due: R ${Number(data.amount || 0).toLocaleString()}. Please pay immediately.`,
  };
}

/**
 * Generate SMS template for upcoming rent due notification
 */
export function generateUpcomingRentSMS(data: NotificationPayload): SMSTemplate {
  return {
    message: `📅 Reminder: Rent for ${data.propertyName} Unit ${data.unitNumber} (R ${Number(data.amount || 0).toLocaleString()}) is due in ${data.daysUntilDue} days.`,
  };
}

/**
 * Generate SMS template for lease expiration notification
 */
export function generateLeaseExpiringSMS(data: NotificationPayload): SMSTemplate {
  return {
    message: `📋 Your lease for ${data.propertyName} Unit ${data.unitNumber} expires in ${data.daysUntilExpiry} days. Contact your landlord to discuss renewal.`,
  };
}

/**
 * Send notification via Manus API
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    let emailTemplate: EmailTemplate | null = null;
    let smsTemplate: SMSTemplate | null = null;

    // Generate appropriate templates based on notification type
    switch (payload.type) {
      case 'overdue_payment':
        emailTemplate = generateOverduePaymentEmail(payload);
        smsTemplate = generateOverduePaymentSMS(payload);
        break;
      case 'upcoming_rent':
        emailTemplate = generateUpcomingRentEmail(payload);
        smsTemplate = generateUpcomingRentSMS(payload);
        break;
      case 'lease_expiring':
        emailTemplate = generateLeaseExpiringEmail(payload);
        smsTemplate = generateLeaseExpiringSMS(payload);
        break;
      default:
        return false;
    }

    // Send email notification
    if (emailTemplate && payload.recipientEmail) {
      const emailSent = await notifyOwner({
        title: emailTemplate.subject,
        content: emailTemplate.body,
      });

      if (!emailSent) {
        console.warn(`Failed to send email notification to ${payload.recipientEmail}`);
      }
    }

    // SMS notification would be sent via Twilio or similar service
    // For now, we'll log it
    if (smsTemplate && payload.recipientPhone) {
      console.log(`SMS to ${payload.recipientPhone}: ${smsTemplate.message}`);
      // In production, integrate with SMS provider here
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Check for overdue payments and send notifications
 */
export async function checkOverduePayments() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    const today = new Date();

    // Get all overdue payments
    const overduePayments = await db
      .select({
        payment: payments,
        tenant: tenants,
        property: properties,
        unit: units,
      })
      .from(payments)
      .innerJoin(leases, eq(payments.leaseId, leases.id))
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .innerJoin(units, eq(leases.unitId, units.id))
      .where(
        and(
          eq(payments.status, 'overdue'),
          lt(payments.dueDate, today)
        )
      );

    // Send notifications for each overdue payment
    for (const record of overduePayments) {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(record.payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only send notification if overdue by at least 1 day
      if (daysOverdue >= 1) {
        await sendNotification({
          type: 'overdue_payment',
          recipientEmail: record.tenant.email || '',
          recipientPhone: record.tenant.phone || undefined,
          tenantName: `${record.tenant.firstName} ${record.tenant.lastName}`,
          propertyName: record.property.name,
          unitNumber: record.unit.unitNumber,
          amount: Number(record.payment.amount) || 0,
          daysOverdue: daysOverdue || 0,
        });
      }
    }

    console.log(`Checked ${overduePayments.length} overdue payments`);
  } catch (error) {
    console.error('Error checking overdue payments:', error);
  }
}

/**
 * Check for upcoming rent due dates and send reminders
 */
export async function checkUpcomingRent() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all payments due in the next 7 days
    const upcomingPayments = await db
      .select({
        payment: payments,
        tenant: tenants,
        property: properties,
        unit: units,
      })
      .from(payments)
      .innerJoin(leases, eq(payments.leaseId, leases.id))
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .innerJoin(units, eq(leases.unitId, units.id))
      .where(
        and(
          eq(payments.status, 'pending'),
          gt(payments.dueDate, today),
          lt(payments.dueDate, sevenDaysFromNow)
        )
      );

    // Send notifications for each upcoming payment
    for (const record of upcomingPayments) {
      const daysUntilDue = Math.ceil(
        (new Date(record.payment.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

        await sendNotification({
          type: 'upcoming_rent',
          recipientEmail: record.tenant.email || '',
          recipientPhone: record.tenant.phone || undefined,
          tenantName: `${record.tenant.firstName} ${record.tenant.lastName}`,
          propertyName: record.property.name,
          unitNumber: record.unit.unitNumber,
          amount: Number(record.payment.amount) || 0,
          daysUntilDue: daysUntilDue || 0,
        });
    }

    console.log(`Checked ${upcomingPayments.length} upcoming payments`);
  } catch (error) {
    console.error('Error checking upcoming rent:', error);
  }
}

/**
 * Check for expiring leases and send notifications
 */
export async function checkExpiringLeases() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get all leases expiring in the next 30 days
    const expiringLeases = await db
      .select({
        lease: leases,
        tenant: tenants,
        property: properties,
        unit: units,
      })
      .from(leases)
      .innerJoin(tenants, eq(leases.tenantId, tenants.id))
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .innerJoin(units, eq(leases.unitId, units.id))
      .where(
        and(
          eq(leases.status, 'active'),
          gt(leases.endDate, today),
          lt(leases.endDate, thirtyDaysFromNow)
        )
      );

    // Send notifications for each expiring lease
    for (const record of expiringLeases) {
      const daysUntilExpiry = Math.ceil(
        (new Date(record.lease.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      await sendNotification({
        type: 'lease_expiring',
        recipientEmail: record.tenant.email || '',
        recipientPhone: record.tenant.phone || undefined,
        tenantName: `${record.tenant.firstName} ${record.tenant.lastName}`,
        propertyName: record.property.name,
        unitNumber: record.unit.unitNumber,
        daysUntilExpiry: daysUntilExpiry || 0,
      });
    }

    console.log(`Checked ${expiringLeases.length} expiring leases`);
  } catch (error) {
    console.error('Error checking expiring leases:', error);
  }
}

/**
 * Run all notification checks
 */
export async function runAllNotificationChecks() {
  console.log('Running all notification checks...');
  await checkOverduePayments();
  await checkUpcomingRent();
  await checkExpiringLeases();
  console.log('Notification checks completed');
}
