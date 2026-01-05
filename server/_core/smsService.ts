import twilio from "twilio";

// SMS client initialization
let smsClient: ReturnType<typeof twilio> | null = null;

function getSmsClient() {
  if (!smsClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn("[SMS] Twilio credentials not configured");
      return null;
    }

    smsClient = twilio(accountSid, authToken);
  }
  return smsClient;
}

export interface SMSTemplate {
  body: string;
}

// SMS templates for critical alerts
export const smsTemplates = {
  overdueRent: (
    tenantName: string,
    propertyName: string,
    rentAmount: number,
    daysOverdue: number
  ): SMSTemplate => ({
    body: `Hi ${tenantName}, your rent payment for ${propertyName} (R${rentAmount.toFixed(0)}) is ${daysOverdue} days overdue. Please arrange payment immediately. Contact your landlord if you have questions.`,
  }),

  leaseExpiration: (
    tenantName: string,
    propertyName: string,
    daysUntilExpiration: number
  ): SMSTemplate => ({
    body: `Hi ${tenantName}, your lease for ${propertyName} expires in ${daysUntilExpiration} days. Please contact your property manager to discuss renewal or move-out arrangements.`,
  }),

  maintenanceCompletion: (
    tenantName: string,
    propertyName: string,
    maintenanceTitle: string
  ): SMSTemplate => ({
    body: `Hi ${tenantName}, the maintenance request for ${propertyName} (${maintenanceTitle}) has been completed. Thank you for your patience.`,
  }),

  paymentReminder: (
    tenantName: string,
    propertyName: string,
    rentAmount: number,
    dueDate: string
  ): SMSTemplate => ({
    body: `Hi ${tenantName}, reminder: your rent for ${propertyName} (R${rentAmount.toFixed(0)}) is due on ${dueDate}. Pay online or contact your landlord.`,
  }),
};

export async function sendSMS(
  phoneNumber: string,
  template: SMSTemplate,
  options?: { fromNumber?: string }
): Promise<boolean> {
  try {
    const client = getSmsClient();

    if (!client) {
      console.warn("[SMS] Twilio client not configured, skipping SMS send");
      return false;
    }

    const fromNumber = options?.fromNumber || process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      console.warn("[SMS] TWILIO_PHONE_NUMBER not configured");
      return false;
    }

    // Validate phone number format (basic check)
    if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      console.warn(`[SMS] Invalid phone number format: ${phoneNumber}`);
      return false;
    }

    // Ensure SMS body is within 160 characters (standard SMS limit)
    if (template.body.length > 160) {
      console.warn(`[SMS] SMS body exceeds 160 characters: ${template.body.length}`);
      // Truncate with ellipsis
      template.body = template.body.substring(0, 157) + "...";
    }

    const message = await client.messages.create({
      body: template.body,
      from: fromNumber,
      to: phoneNumber,
    });

    console.log(`[SMS] Sent to ${phoneNumber}: ${message.sid}`);
    return true;
  } catch (error) {
    console.error("[SMS] Failed to send SMS:", error);
    return false;
  }
}

export async function sendBulkSMS(
  recipients: Array<{ phoneNumber: string; template: SMSTemplate }>,
  options?: { delayMs?: number; fromNumber?: string }
): Promise<number> {
  let successCount = 0;
  const delayMs = options?.delayMs || 500;

  for (const recipient of recipients) {
    const success = await sendSMS(recipient.phoneNumber, recipient.template, {
      fromNumber: options?.fromNumber,
    });
    if (success) successCount++;

    // Add delay between SMS to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return successCount;
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164 format validation: +[country code][number]
  return /^\+?[1-9]\d{1,14}$/.test(phoneNumber);
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Convert to E.164 format if needed
  if (!phoneNumber.startsWith("+")) {
    // Assume South African number if no country code
    if (phoneNumber.startsWith("0")) {
      return "+27" + phoneNumber.substring(1);
    }
    return "+" + phoneNumber;
  }
  return phoneNumber;
}
