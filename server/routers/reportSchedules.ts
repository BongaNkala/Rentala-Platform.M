import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createReportSchedule,
  updateReportSchedule,
  getUserSchedules,
  getScheduleDeliveryHistory,
  executeScheduledReport,
} from "../services/reportScheduler";
import { getDb } from "../db";
import { reportSchedules } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

type ReportMetric = "overall" | "cleanliness" | "maintenance" | "communication" | "responsiveness" | "value" | "surveys" | "recommendations";

export const reportSchedulesRouter = router({
  /**
   * Create a new report schedule
   */
  createSchedule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"]),
        recipientEmails: z.array(z.string().email()),
        metrics: z.array(z.enum(["overall", "cleanliness", "maintenance", "communication", "responsiveness", "value", "surveys", "recommendations"])),
        propertyId: z.number().optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        hour: z.number().min(0).max(23).optional(),
        minute: z.number().min(0).max(59).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const schedule = await createReportSchedule(
          ctx.user.id,
          input.name,
          input.frequency,
          input.recipientEmails,
          input.metrics as ReportMetric[],
          input.propertyId,
          input.dayOfWeek,
          input.dayOfMonth,
          input.hour,
          input.minute,
          input.description
        );

        if (!schedule) {
          throw new Error("Failed to create schedule");
        }

        return {
          success: true,
          schedule: {
            ...schedule,
            recipientEmails: JSON.parse(schedule.recipientEmails),
            metrics: JSON.parse(schedule.metrics),
          },
        };
      } catch (error) {
        console.error("Failed to create schedule:", error);
        throw new Error("Failed to create report schedule");
      }
    }),

  /**
   * Update an existing report schedule
   */
  updateSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"]).optional(),
        recipientEmails: z.array(z.string().email()).optional(),
        metrics: z.array(z.enum(["overall", "cleanliness", "maintenance", "communication", "responsiveness", "value", "surveys", "recommendations"])).optional(),
        status: z.enum(["active", "paused", "completed"]).optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        hour: z.number().min(0).max(23).optional(),
        minute: z.number().min(0).max(59).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify ownership
        const scheduleResult = await db
          .select()
          .from(reportSchedules)
          .where(eq(reportSchedules.id, input.scheduleId))
          .limit(1);

        if (scheduleResult.length === 0 || scheduleResult[0].userId !== ctx.user.id) {
          throw new Error("Schedule not found or unauthorized");
        }

        const updates: Record<string, any> = {};
        if (input.name) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.frequency) updates.frequency = input.frequency;
        if (input.recipientEmails) updates.recipientEmails = JSON.stringify(input.recipientEmails);
        if (input.metrics) updates.metrics = JSON.stringify(input.metrics);
        if (input.status) updates.status = input.status;
        if (input.dayOfWeek !== undefined) updates.dayOfWeek = input.dayOfWeek;
        if (input.dayOfMonth !== undefined) updates.dayOfMonth = input.dayOfMonth;
        if (input.hour !== undefined) updates.hour = input.hour;
        if (input.minute !== undefined) updates.minute = input.minute;

        const updated = await updateReportSchedule(input.scheduleId, updates);

        if (!updated) {
          throw new Error("Failed to update schedule");
        }

        return {
          success: true,
          schedule: {
            ...updated,
            recipientEmails: JSON.parse(updated.recipientEmails),
            metrics: JSON.parse(updated.metrics),
          },
        };
      } catch (error) {
        console.error("Failed to update schedule:", error);
        throw new Error("Failed to update report schedule");
      }
    }),

  /**
   * Get all schedules for the current user
   */
  getSchedules: protectedProcedure.query(async ({ ctx }) => {
    try {
      const schedules = await getUserSchedules(ctx.user.id);
      return schedules.map((s) => ({
        ...s,
        recipientEmails: JSON.parse(s.recipientEmails),
        metrics: JSON.parse(s.metrics),
      }));
    } catch (error) {
      console.error("Failed to get schedules:", error);
      return [];
    }
  }),

  /**
   * Get delivery history for a schedule
   */
  getDeliveryHistory: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        // Verify ownership
        const scheduleResult = await db
          .select()
          .from(reportSchedules)
          .where(eq(reportSchedules.id, input.scheduleId))
          .limit(1);

        if (scheduleResult.length === 0 || scheduleResult[0].userId !== ctx.user.id) {
          throw new Error("Schedule not found or unauthorized");
        }

        const history = await getScheduleDeliveryHistory(input.scheduleId, input.limit);
        return history;
      } catch (error) {
        console.error("Failed to get delivery history:", error);
        return [];
      }
    }),

  /**
   * Test send a report for a schedule (immediate delivery)
   */
  testSendReport: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify ownership
        const scheduleResult = await db
          .select()
          .from(reportSchedules)
          .where(eq(reportSchedules.id, input.scheduleId))
          .limit(1);

        if (scheduleResult.length === 0 || scheduleResult[0].userId !== ctx.user.id) {
          throw new Error("Schedule not found or unauthorized");
        }

        const success = await executeScheduledReport(input.scheduleId);

        return {
          success,
          message: success ? "Test report sent successfully" : "Failed to send test report",
        };
      } catch (error) {
        console.error("Failed to test send report:", error);
        throw new Error("Failed to send test report");
      }
    }),

  /**
   * Delete a report schedule
   */
  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify ownership
        const scheduleResult = await db
          .select()
          .from(reportSchedules)
          .where(eq(reportSchedules.id, input.scheduleId))
          .limit(1);

        if (scheduleResult.length === 0 || scheduleResult[0].userId !== ctx.user.id) {
          throw new Error("Schedule not found or unauthorized");
        }

        // Mark as completed instead of deleting for audit trail
        await updateReportSchedule(input.scheduleId, { status: "completed" });

        return { success: true };
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        throw new Error("Failed to delete report schedule");
      }
    }),
});
