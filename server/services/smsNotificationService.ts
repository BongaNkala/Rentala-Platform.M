import axios from 'axios';

interface SendSMSInput {
  phoneNumber: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface RentReminderInput {
  tenantPhoneNumber: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  rentAmount: number;
  dueDate: Date;
  currency?: string;
}

interface OverdueAlertInput {
  tenantPhoneNumber: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  overdueAmount: number;
  daysOverdue: number;
  currency?: string;
}

const MANUS_API_URL = process.env.BUILT_IN_FORGE_API_URL || '';
const MANUS_API_KEY = process.env.BUILT_IN_FORGE_API_KEY || '';

/**
 * Send SMS notification using Manus API
 */
export async function sendSMS(input: SendSMSInput): Promise<SMSResponse> {
  try {
    if (!MANUS_API_URL || !MANUS_API_KEY) {
      console.warn('SMS API not configured. Skipping SMS send.');
      return {
        success: false,
        error: 'SMS API not configured',
      };
    }

    const response = await axios.post(
      `${MANUS_API_URL}/notification/sms`,
      {
        phoneNumber: input.phoneNumber,
        message: input.message,
        templateId: input.templateId,
        variables: input.variables,
      },
      {
        headers: {
          Authorization: `Bearer ${MANUS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      messageId: response.data.messageId,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send rent reminder SMS
 */
export async function sendRentReminder(input: RentReminderInput): Promise<SMSResponse> {
  const dueDate = new Date(input.dueDate).toLocaleDateString();
  const currency = input.currency || 'ZAR';

  const message = `Hi ${input.tenantName}, your rent for ${input.propertyName} Unit ${input.unitNumber} is due on ${dueDate}. Amount: ${currency} ${input.rentAmount.toLocaleString()}. Please ensure payment is made on time. Contact your landlord if you have questions.`;

  return sendSMS({
    phoneNumber: input.tenantPhoneNumber,
    message,
    templateId: 'rent_reminder',
    variables: {
      tenantName: input.tenantName,
      propertyName: input.propertyName,
      unitNumber: input.unitNumber,
      rentAmount: input.rentAmount.toString(),
      dueDate,
      currency,
    },
  });
}

/**
 * Send overdue payment alert SMS
 */
export async function sendOverdueAlert(input: OverdueAlertInput): Promise<SMSResponse> {
  const currency = input.currency || 'ZAR';

  const message = `⚠️ Payment Overdue: ${input.tenantName}, your rent for ${input.propertyName} Unit ${input.unitNumber} is ${input.daysOverdue} days overdue. Outstanding amount: ${currency} ${input.overdueAmount.toLocaleString()}. Please pay immediately to avoid further action. Contact your landlord.`;

  return sendSMS({
    phoneNumber: input.tenantPhoneNumber,
    message,
    templateId: 'overdue_alert',
    variables: {
      tenantName: input.tenantName,
      propertyName: input.propertyName,
      unitNumber: input.unitNumber,
      overdueAmount: input.overdueAmount.toString(),
      daysOverdue: input.daysOverdue.toString(),
      currency,
    },
  });
}

/**
 * Send payment received confirmation SMS
 */
export async function sendPaymentConfirmation(
  phoneNumber: string,
  tenantName: string,
  amount: number,
  propertyName: string,
  unitNumber: string,
  currency: string = 'ZAR'
): Promise<SMSResponse> {
  const message = `✓ Payment Received: Hi ${tenantName}, we've received your payment of ${currency} ${amount.toLocaleString()} for ${propertyName} Unit ${unitNumber}. Thank you!`;

  return sendSMS({
    phoneNumber,
    message,
    templateId: 'payment_confirmation',
    variables: {
      tenantName,
      amount: amount.toString(),
      propertyName,
      unitNumber,
      currency,
    },
  });
}

/**
 * Send lease expiry notification SMS
 */
export async function sendLeaseExpiryNotification(
  phoneNumber: string,
  tenantName: string,
  propertyName: string,
  unitNumber: string,
  expiryDate: Date
): Promise<SMSResponse> {
  const expiryDateStr = new Date(expiryDate).toLocaleDateString();

  const message = `📋 Lease Expiry Notice: Hi ${tenantName}, your lease for ${propertyName} Unit ${unitNumber} expires on ${expiryDateStr}. Please contact your landlord to discuss renewal or move-out arrangements.`;

  return sendSMS({
    phoneNumber,
    message,
    templateId: 'lease_expiry',
    variables: {
      tenantName,
      propertyName,
      unitNumber,
      expiryDate: expiryDateStr,
    },
  });
}

/**
 * Send maintenance request update SMS
 */
export async function sendMaintenanceUpdate(
  phoneNumber: string,
  tenantName: string,
  propertyName: string,
  unitNumber: string,
  status: string,
  description: string
): Promise<SMSResponse> {
  const message = `🔧 Maintenance Update: Hi ${tenantName}, your maintenance request for ${propertyName} Unit ${unitNumber} (${description}) is now ${status}. We'll keep you updated.`;

  return sendSMS({
    phoneNumber,
    message,
    templateId: 'maintenance_update',
    variables: {
      tenantName,
      propertyName,
      unitNumber,
      status,
      description,
    },
  });
}

/**
 * Send bulk SMS to multiple tenants
 */
export async function sendBulkSMS(
  recipients: Array<{ phoneNumber: string; message: string }>
): Promise<SMSResponse[]> {
  const results = await Promise.all(
    recipients.map((recipient) =>
      sendSMS({
        phoneNumber: recipient.phoneNumber,
        message: recipient.message,
      })
    )
  );

  return results;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // South African phone number format validation
  // Accepts: +27XXXXXXXXXX, 27XXXXXXXXXX, 0XXXXXXXXX
  const phoneRegex = /^(\+27|27|0)[0-9]{9}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Convert to +27 format
  if (cleaned.startsWith('27')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+27${cleaned.substring(1)}`;
  }

  return `+${cleaned}`;
}

export default {
  sendSMS,
  sendRentReminder,
  sendOverdueAlert,
  sendPaymentConfirmation,
  sendLeaseExpiryNotification,
  sendMaintenanceUpdate,
  sendBulkSMS,
  validatePhoneNumber,
  formatPhoneNumber,
};
