import { getDb } from "../db";
import { userPreferences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface MetricPreferences {
  selectedMetrics: string[];
  lastUpdated: number;
}

export interface SchedulePreferences {
  defaultFrequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";
  defaultHour: number;
  defaultMinute: number;
  defaultDayOfMonth: number;
  lastUpdated: number;
}

export interface SavedUserPreferences {
  metrics: MetricPreferences;
  schedule: SchedulePreferences;
}

/**
 * Get user preferences from the database
 */
export async function getUserPreferences(userId: number): Promise<SavedUserPreferences | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    const prefs = result.length > 0 ? result[0] : null;

    if (!prefs) {
      return null;
    }

    return {
      metrics: {
        selectedMetrics: JSON.parse(prefs.metrics),
        lastUpdated: prefs.updatedAt.getTime(),
      },
      schedule: {
        defaultFrequency: prefs.defaultFrequency as any,
        defaultHour: prefs.defaultHour,
        defaultMinute: prefs.defaultMinute,
        defaultDayOfMonth: prefs.defaultDayOfMonth,
        lastUpdated: prefs.syncedAt.getTime(),
      },
    };
  } catch (error) {
    console.error("Failed to get user preferences:", error);
    return null;
  }
}

/**
 * Save or update user preferences
 */
export async function saveUserPreferences(
  userId: number,
  preferences: SavedUserPreferences
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const metricsJson = JSON.stringify(preferences.metrics.selectedMetrics);

    // Check if preferences exist
    const existingResult = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    const existing = existingResult.length > 0 ? existingResult[0] : null;

    if (existing) {
      // Update existing
      await db
        .update(userPreferences)
        .set({
          metrics: metricsJson,
          defaultFrequency: preferences.schedule.defaultFrequency,
          defaultHour: preferences.schedule.defaultHour,
          defaultMinute: preferences.schedule.defaultMinute,
          defaultDayOfMonth: preferences.schedule.defaultDayOfMonth,
          syncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId));
    } else {
      // Insert new
      await db.insert(userPreferences).values({
        userId,
        metrics: metricsJson,
        defaultFrequency: preferences.schedule.defaultFrequency,
        defaultHour: preferences.schedule.defaultHour,
        defaultMinute: preferences.schedule.defaultMinute,
        defaultDayOfMonth: preferences.schedule.defaultDayOfMonth,
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to save user preferences:", error);
    return false;
  }
}

/**
 * Delete user preferences
 */
export async function deleteUserPreferences(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
    return true;
  } catch (error) {
    console.error("Failed to delete user preferences:", error);
    return false;
  }
}

/**
 * Check if preferences need syncing (client is older than server)
 */
export function shouldSyncFromServer(
  clientLastUpdated: number,
  serverLastUpdated: number
): boolean {
  return serverLastUpdated > clientLastUpdated;
}
