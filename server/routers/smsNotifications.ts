import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { sendSMS, smsTemplates, formatPhoneNumber, validatePhoneNumber } from "../_core/smsService";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { tenants, properties } from "../../drizzle/schema";

const sendSMSSchema = z.object({
  tenantId: z.number().int().positive(),
  type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion", "payment_reminder"]),
  propertyId: z.number().int().positive(),
  additionalData: z.object({
    rentAmount: z.number().optional(),
    daysOverdue: z.number().optional(),
    daysUntilExpiration: z.number().optional(),
    maintenanceTitle: z.string().optional(),
    dueDate: z.string().optional(),
  }).optional(),
});

export const smsNotificationsRouter = router({
  // Send manual SMS notification
  sendSMS: protectedProcedure
    .input(sendSMSSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user owns the property
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, input.propertyId))
        .limit(1);

      if (!property || property.length === 0) {
        throw new Error("Property not found");
      }

      if (property[0].ownerId !== ctx.user!.id) {
        throw new Error("Unauthorized: You do not own this property");
      }

      // Get tenant info
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.tenantId))
        .limit(1);

      if (!tenant || tenant.length === 0 || !tenant[0].phone) {
        throw new Error("Tenant not found or has no phone number");
      }

      // Validate phone number
      if (!validatePhoneNumber(tenant[0].phone)) {
        throw new Error("Invalid phone number format");
      }

      let smsTemplate;
      const tenantName = tenant[0].firstName || "Tenant";
      const propertyName = property[0].name;
      const formattedPhone = formatPhoneNumber(tenant[0].phone);

      switch (input.type) {
        case "overdue_rent":
          smsTemplate = smsTemplates.overdueRent(
            tenantName,
            propertyName,
            (input.additionalData?.rentAmount as number) || 0,
            (input.additionalData?.daysOverdue as number) || 7
          );
          break;

        case "lease_expiration":
          smsTemplate = smsTemplates.leaseExpiration(
            tenantName,
            propertyName,
            (input.additionalData?.daysUntilExpiration as number) || 30
          );
          break;

        case "maintenance_completion":
          smsTemplate = smsTemplates.maintenanceCompletion(
            tenantName,
            propertyName,
            (input.additionalData?.maintenanceTitle as string) || "Maintenance"
          );
          break;

        case "payment_reminder":
          smsTemplate = smsTemplates.paymentReminder(
            tenantName,
            propertyName,
            (input.additionalData?.rentAmount as number) || 0,
            (input.additionalData?.dueDate as string) || new Date().toLocaleDateString()
          );
          break;

        default:
          throw new Error("Invalid SMS type");
      }

      const success = await sendSMS(formattedPhone, smsTemplate);

      return {
        success,
        message: success ? "SMS sent successfully" : "Failed to send SMS",
        phoneNumber: formattedPhone,
      };
    }),

  // Validate phone number
  validatePhone: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .query(({ input }) => {
      const isValid = validatePhoneNumber(input.phoneNumber);
      const formatted = formatPhoneNumber(input.phoneNumber);

      return {
        isValid,
        formatted,
        message: isValid ? "Phone number is valid" : "Invalid phone number format",
      };
    }),

  // Get SMS notification history
  getHistory: protectedProcedure
    .input(
      z.object({
        propertyId: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // This would query an SMS history table if it exists
      // For now, return empty array as placeholder
      return {
        notifications: [],
        total: 0,
      };
    }),
});
