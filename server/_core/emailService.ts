import nodemailer from "nodemailer";
import { ENV } from "./env";

// Email transporter configuration
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    // Use environment variables for email configuration
    // For development, you can use a test email service like Ethereal
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates
export const emailTemplates = {
  overdueRent: (
    tenantName: string,
    propertyName: string,
    rentAmount: number,
    daysOverdue: number
  ): EmailTemplate => ({
    subject: `Overdue Rent Payment - ${propertyName}`,
    html: `
      <h2>Overdue Rent Payment Notice</h2>
      <p>Dear ${tenantName},</p>
      <p>This is a reminder that your rent payment for <strong>${propertyName}</strong> is <strong>${daysOverdue} days overdue</strong>.</p>
      <p><strong>Payment Details:</strong></p>
      <ul>
        <li>Property: ${propertyName}</li>
        <li>Amount Due: R ${rentAmount.toFixed(2)}</li>
        <li>Days Overdue: ${daysOverdue}</li>
      </ul>
      <p>Please arrange payment as soon as possible to avoid further action.</p>
      <p>If you have already made this payment, please disregard this notice.</p>
      <p>Best regards,<br/>Rentala Property Management</p>
    `,
    text: `
      Overdue Rent Payment Notice

      Dear ${tenantName},

      This is a reminder that your rent payment for ${propertyName} is ${daysOverdue} days overdue.

      Payment Details:
      - Property: ${propertyName}
      - Amount Due: R ${rentAmount.toFixed(2)}
      - Days Overdue: ${daysOverdue}

      Please arrange payment as soon as possible to avoid further action.

      If you have already made this payment, please disregard this notice.

      Best regards,
      Rentala Property Management
    `,
  }),

  leaseExpiration: (
    tenantName: string,
    propertyName: string,
    expirationDate: string,
    daysUntilExpiration: number
  ): EmailTemplate => ({
    subject: `Lease Expiration Notice - ${propertyName}`,
    html: `
      <h2>Lease Expiration Notice</h2>
      <p>Dear ${tenantName},</p>
      <p>This is a reminder that your lease for <strong>${propertyName}</strong> will expire in <strong>${daysUntilExpiration} days</strong>.</p>
      <p><strong>Lease Details:</strong></p>
      <ul>
        <li>Property: ${propertyName}</li>
        <li>Expiration Date: ${expirationDate}</li>
        <li>Days Until Expiration: ${daysUntilExpiration}</li>
      </ul>
      <p>Please contact your property manager to discuss lease renewal options or move-out arrangements.</p>
      <p>Best regards,<br/>Rentala Property Management</p>
    `,
    text: `
      Lease Expiration Notice

      Dear ${tenantName},

      This is a reminder that your lease for ${propertyName} will expire in ${daysUntilExpiration} days.

      Lease Details:
      - Property: ${propertyName}
      - Expiration Date: ${expirationDate}
      - Days Until Expiration: ${daysUntilExpiration}

      Please contact your property manager to discuss lease renewal options or move-out arrangements.

      Best regards,
      Rentala Property Management
    `,
  }),

  maintenanceCompletion: (
    tenantName: string,
    propertyName: string,
    maintenanceTitle: string,
    completionDate: string
  ): EmailTemplate => ({
    subject: `Maintenance Completed - ${propertyName}`,
    html: `
      <h2>Maintenance Completed</h2>
      <p>Dear ${tenantName},</p>
      <p>The maintenance request for <strong>${propertyName}</strong> has been completed.</p>
      <p><strong>Maintenance Details:</strong></p>
      <ul>
        <li>Property: ${propertyName}</li>
        <li>Maintenance: ${maintenanceTitle}</li>
        <li>Completed Date: ${completionDate}</li>
      </ul>
      <p>If you have any questions or concerns, please contact your property manager.</p>
      <p>Best regards,<br/>Rentala Property Management</p>
    `,
    text: `
      Maintenance Completed

      Dear ${tenantName},

      The maintenance request for ${propertyName} has been completed.

      Maintenance Details:
      - Property: ${propertyName}
      - Maintenance: ${maintenanceTitle}
      - Completed Date: ${completionDate}

      If you have any questions or concerns, please contact your property manager.

      Best regards,
      Rentala Property Management
    `,
  }),

  landlordNotification: (
    landlordName: string,
    title: string,
    content: string
  ): EmailTemplate => ({
    subject: `Rentala Notification: ${title}`,
    html: `
      <h2>${title}</h2>
      <p>Dear ${landlordName},</p>
      <p>${content}</p>
      <p>Best regards,<br/>Rentala Property Management System</p>
    `,
    text: `
      ${title}

      Dear ${landlordName},

      ${content}

      Best regards,
      Rentala Property Management System
    `,
  }),
};

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  options?: { cc?: string; bcc?: string }
): Promise<boolean> {
  try {
    const transporter = getTransporter();

    if (!process.env.SMTP_USER) {
      console.warn("[Email] SMTP_USER not configured, skipping email send");
      return false;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      cc: options?.cc,
      bcc: options?.bcc,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent to ${to}: ${template.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

export async function sendBulkEmails(
  recipients: Array<{ email: string; template: EmailTemplate }>,
  options?: { delayMs?: number }
): Promise<number> {
  let successCount = 0;
  const delayMs = options?.delayMs || 1000;

  for (const recipient of recipients) {
    const success = await sendEmail(recipient.email, recipient.template);
    if (success) successCount++;

    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return successCount;
}
