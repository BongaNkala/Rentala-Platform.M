import { getDb } from "../db";
import { reportSchedules, reportDeliveryHistory, ReportSchedule, InsertReportDeliveryHistory } from "../../drizzle/schema";
import { getTenantSatisfactionTrends } from "./propertyAnalytics";
import { generateSatisfactionReportPDFBuffer, type ReportMetric } from "./satisfactionReportPdf";
import { eq, and, lte, isNull } from "drizzle-orm";

/**
 * Calculate next send time based on schedule frequency
 */
export function calculateNextSendTime(schedule: ReportSchedule): Date {
  const now = new Date();
  const next = new Date(now);

  switch (schedule.frequency) {
    case "weekly": {
      const targetDay = schedule.dayOfWeek || 1; // Default to Monday
      const daysUntilTarget = (targetDay - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget);
      break;
    }
    case "biweekly": {
      const targetDay = schedule.dayOfWeek || 1;
      const daysUntilTarget = (targetDay - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget + 7);
      break;
    }
    case "monthly": {
      const targetDay = schedule.dayOfMonth || 1;
      next.setMonth(next.getMonth() + 1);
      next.setDate(targetDay);
      break;
    }
    case "quarterly": {
      const targetDay = schedule.dayOfMonth || 1;
      next.setMonth(next.getMonth() + 3);
      next.setDate(targetDay);
      break;
    }
    case "annually": {
      const targetDay = schedule.dayOfMonth || 1;
      next.setFullYear(next.getFullYear() + 1);
      next.setDate(targetDay);
      break;
    }
  }

  // Set time
  next.setHours(schedule.hour || 9, schedule.minute || 0, 0, 0);

  // If calculated time is in the past, move to next cycle
  if (next <= now) {
    return calculateNextSendTime({ ...schedule, dayOfMonth: (schedule.dayOfMonth || 1) + 1 } as ReportSchedule);
  }

  return next;
}

/**
 * Get schedules that are due for sending
 */
export async function getDueSchedules(): Promise<ReportSchedule[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();
    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(
        and(
          eq(reportSchedules.status, "active"),
          lte(reportSchedules.nextSendAt, now)
        )
      );

    return schedules;
  } catch (error) {
    console.error("Failed to get due schedules:", error);
    return [];
  }
}

/**
 * Generate and send report for a schedule
 */
export async function executeScheduledReport(scheduleId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get schedule
    const scheduleResult = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.id, scheduleId))
      .limit(1);

    if (scheduleResult.length === 0) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const schedule = scheduleResult[0];
    const recipientEmails = JSON.parse(schedule.recipientEmails) as string[];
    const metrics = JSON.parse(schedule.metrics) as ReportMetric[];

    // Get property name
    let propertyName = "All Properties";
    if (schedule.propertyId) {
      const { properties } = await import("../../drizzle/schema");
      const propsResult = await db
        .select({ name: properties.name })
        .from(properties)
        .where(eq(properties.id, schedule.propertyId))
        .limit(1);
      if (propsResult.length > 0) {
        propertyName = propsResult[0].name;
      }
    }

    // Generate satisfaction data
    const satisfactionData = await getTenantSatisfactionTrends(12, schedule.propertyId || undefined);

    // Generate PDF
    const pdfBuffer = await generateSatisfactionReportPDFBuffer(
      propertyName,
      satisfactionData,
      12,
      metrics
    );

    // Record delivery attempts
    const now = new Date();
    for (const email of recipientEmails) {
      const deliveryRecord: InsertReportDeliveryHistory = {
        scheduleId,
        userId: schedule.userId,
        propertyId: schedule.propertyId,
        recipientEmail: email,
        status: "sent", // In production, integrate with actual email service
        sentAt: now,
      };

      await db.insert(reportDeliveryHistory).values(deliveryRecord);
    }

    // Update schedule
    await db
      .update(reportSchedules)
      .set({
        lastSentAt: now,
        nextSendAt: calculateNextSendTime(schedule),
      })
      .where(eq(reportSchedules.id, scheduleId));

    return true;
  } catch (error) {
    console.error(`Failed to execute scheduled report ${scheduleId}:`, error);

    // Record failure
    try {
      const db = await getDb();
      if (db) {
        const scheduleResult = await db
          .select()
          .from(reportSchedules)
          .where(eq(reportSchedules.id, scheduleId))
          .limit(1);

        if (scheduleResult.length > 0) {
          const schedule = scheduleResult[0];
          const recipientEmails = JSON.parse(schedule.recipientEmails) as string[];

          for (const email of recipientEmails) {
            await db.insert(reportDeliveryHistory).values({
              scheduleId,
              userId: schedule.userId,
              propertyId: schedule.propertyId,
              recipientEmail: email,
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      }
    } catch (recordError) {
      console.error("Failed to record delivery failure:", recordError);
    }

    return false;
  }
}

/**
 * Create a new report schedule
 */
export async function createReportSchedule(
  userId: number,
  name: string,
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annually",
  recipientEmails: string[],
  metrics: ReportMetric[],
  propertyId?: number,
  dayOfWeek?: number,
  dayOfMonth?: number,
  hour?: number,
  minute?: number,
  description?: string
): Promise<ReportSchedule | null> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const nextSendAt = calculateNextSendTime({
      id: 0,
      userId,
      propertyId: propertyId || null,
      name,
      description: description || null,
      frequency,
      dayOfWeek: dayOfWeek || null,
      dayOfMonth: dayOfMonth || null,
      hour: hour || 9,
      minute: minute || 0,
      recipientEmails: JSON.stringify(recipientEmails),
      metrics: JSON.stringify(metrics),
      status: "active",
      lastSentAt: null,
      nextSendAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(reportSchedules).values({
      userId,
      propertyId: propertyId || null,
      name,
      description: description || null,
      frequency,
      dayOfWeek: dayOfWeek || null,
      dayOfMonth: dayOfMonth || null,
      hour: hour || 9,
      minute: minute || 0,
      recipientEmails: JSON.stringify(recipientEmails),
      metrics: JSON.stringify(metrics),
      status: "active",
      nextSendAt,
    });

    // Get the created schedule
    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(1);

    return schedules[0] || null;
  } catch (error) {
    console.error("Failed to create report schedule:", error);
    return null;
  }
}

/**
 * Update an existing report schedule
 */
export async function updateReportSchedule(
  scheduleId: number,
  updates: Partial<Omit<ReportSchedule, "id" | "createdAt">>
): Promise<ReportSchedule | null> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // If frequency or timing changed, recalculate next send time
    let updateData = { ...updates, updatedAt: new Date() };
    if (updates.frequency || updates.dayOfWeek || updates.dayOfMonth || updates.hour || updates.minute) {
      const scheduleResult = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, scheduleId))
        .limit(1);

      if (scheduleResult.length > 0) {
        const current = scheduleResult[0];
        const merged = { ...current, ...updateData };
        updateData = { ...updateData, nextSendAt: calculateNextSendTime(merged) };
      }
    }

    await db.update(reportSchedules).set(updateData).where(eq(reportSchedules.id, scheduleId));

    const updated = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.id, scheduleId))
      .limit(1);

    return updated[0] || null;
  } catch (error) {
    console.error("Failed to update report schedule:", error);
    return null;
  }
}

/**
 * Get all schedules for a user
 */
export async function getUserSchedules(userId: number): Promise<ReportSchedule[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const schedules = await db
      .select()
      .from(reportSchedules)
      .where(eq(reportSchedules.userId, userId));

    return schedules;
  } catch (error) {
    console.error("Failed to get user schedules:", error);
    return [];
  }
}

/**
 * Get delivery history for a schedule
 */
export async function getScheduleDeliveryHistory(scheduleId: number, limit: number = 50) {
  try {
    const db = await getDb();
    if (!db) return [];

    const history = await db
      .select()
      .from(reportDeliveryHistory)
      .where(eq(reportDeliveryHistory.scheduleId, scheduleId))
      .orderBy((t) => t.createdAt)
      .limit(limit);

    return history;
  } catch (error) {
    console.error("Failed to get delivery history:", error);
    return [];
  }
}
