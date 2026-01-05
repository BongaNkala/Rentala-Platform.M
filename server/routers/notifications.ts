import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { sendEmail, emailTemplates } from "../_core/emailService";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { tenants, properties, leases } from "../../drizzle/schema";

const sendNotificationSchema = z.object({
  tenantId: z.number().int().positive(),
  type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion"]),
  propertyId: z.number().int().positive(),
  additionalData: z.object({
    rentAmount: z.number().optional(),
    daysOverdue: z.number().optional(),
    expirationDate: z.string().optional(),
    daysUntilExpiration: z.number().optional(),
    maintenanceTitle: z.string().optional(),
    completionDate: z.string().optional(),
  }).optional(),
});

export const notificationsRouter = router({
  // Send manual notification
  sendNotification: protectedProcedure
    .input(sendNotificationSchema)
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

      if (!tenant || tenant.length === 0 || !tenant[0].email) {
        throw new Error("Tenant not found or has no email");
      }

      let template;
      const tenantName = tenant[0].firstName || "Tenant";
      const propertyName = property[0].name;

      switch (input.type) {
        case "overdue_rent":
          template = emailTemplates.overdueRent(
            tenantName,
            propertyName,
            (input.additionalData?.rentAmount as number) || 0,
            (input.additionalData?.daysOverdue as number) || 7
          );
          break;

        case "lease_expiration":
          template = emailTemplates.leaseExpiration(
            tenantName,
            propertyName,
            (input.additionalData?.expirationDate as string) || new Date().toLocaleDateString(),
            (input.additionalData?.daysUntilExpiration as number) || 30
          );
          break;

        case "maintenance_completion":
          template = emailTemplates.maintenanceCompletion(
            tenantName,
            propertyName,
            (input.additionalData?.maintenanceTitle as string) || "Maintenance",
            (input.additionalData?.completionDate as string) || new Date().toLocaleDateString()
          );
          break;

        default:
          throw new Error("Invalid notification type");
      }

      const success = await sendEmail(tenant[0].email, template);

      return {
        success,
        message: success ? "Notification sent successfully" : "Failed to send notification",
      };
    }),

  // Get notification history
  getHistory: protectedProcedure
    .input(
      z.object({
        propertyId: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // This would query a notifications history table if it exists
      // For now, return empty array as placeholder
      return {
        notifications: [],
        total: 0,
      };
    }),
});
