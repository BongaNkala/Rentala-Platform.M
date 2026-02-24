import { getDb } from "../db";
import { preferenceVersions, userPreferences } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import type { SavedUserPreferences } from "./preferenceService";

export interface PreferenceVersionInfo {
  id: number;
  versionNumber: number;
  metrics: string[];
  frequency: string;
  hour: number;
  minute: number;
  dayOfMonth: number;
  changeDescription?: string;
  createdAt: Date;
}

export interface VersionDiff {
  metricsAdded: string[];
  metricsRemoved: string[];
  frequencyChanged: boolean;
  timeChanged: boolean;
  oldFrequency?: string;
  newFrequency?: string;
  oldTime?: string;
  newTime?: string;
}

const MAX_VERSIONS_PER_USER = 20;

/**
 * Save a new preference version
 */
export async function savePreferenceVersion(
  userId: number,
  preferences: SavedUserPreferences,
  changeDescription?: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get the next version number
    const lastVersion = await db
      .select()
      .from(preferenceVersions)
      .where(eq(preferenceVersions.userId, userId))
      .orderBy(desc(preferenceVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = (lastVersion[0]?.versionNumber ?? 0) + 1;

    // Save the new version
    await db.insert(preferenceVersions).values({
      userId,
      versionNumber: nextVersionNumber,
      metrics: JSON.stringify(preferences.metrics.selectedMetrics),
      defaultFrequency: preferences.schedule.defaultFrequency,
      defaultHour: preferences.schedule.defaultHour,
      defaultMinute: preferences.schedule.defaultMinute,
      defaultDayOfMonth: preferences.schedule.defaultDayOfMonth,
      changeDescription,
    });

    // Clean up old versions (keep only latest MAX_VERSIONS_PER_USER)
    await cleanupOldVersions(userId);

    return true;
  } catch (error) {
    console.error("Failed to save preference version:", error);
    return false;
  }
}

/**
 * Get all preference versions for a user
 */
export async function getPreferenceVersions(userId: number): Promise<PreferenceVersionInfo[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const versions = await db
      .select()
      .from(preferenceVersions)
      .where(eq(preferenceVersions.userId, userId))
      .orderBy(desc(preferenceVersions.versionNumber));

    return versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      metrics: JSON.parse(v.metrics),
      frequency: v.defaultFrequency,
      hour: v.defaultHour,
      minute: v.defaultMinute,
      dayOfMonth: v.defaultDayOfMonth,
      changeDescription: v.changeDescription || undefined,
      createdAt: v.createdAt,
    }));
  } catch (error) {
    console.error("Failed to get preference versions:", error);
    return [];
  }
}

/**
 * Restore a preference version
 */
export async function restorePreferenceVersion(
  userId: number,
  versionId: number
): Promise<SavedUserPreferences | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Get the version to restore
    const version = await db
      .select()
      .from(preferenceVersions)
      .where(and(eq(preferenceVersions.id, versionId), eq(preferenceVersions.userId, userId)))
      .limit(1);

    if (version.length === 0) return null;

    const v = version[0];
    const preferences: SavedUserPreferences = {
      metrics: {
        selectedMetrics: JSON.parse(v.metrics),
        lastUpdated: Date.now(),
      },
      schedule: {
        defaultFrequency: v.defaultFrequency as any,
        defaultHour: v.defaultHour,
        defaultMinute: v.defaultMinute,
        defaultDayOfMonth: v.defaultDayOfMonth,
        lastUpdated: Date.now(),
      },
    };

    // Update current preferences
    await db
      .update(userPreferences)
      .set({
        metrics: JSON.stringify(preferences.metrics.selectedMetrics),
        defaultFrequency: preferences.schedule.defaultFrequency,
        defaultHour: preferences.schedule.defaultHour,
        defaultMinute: preferences.schedule.defaultMinute,
        defaultDayOfMonth: preferences.schedule.defaultDayOfMonth,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));

    // Create a new version entry for the restoration
    await savePreferenceVersion(
      userId,
      preferences,
      `Restored from version ${v.versionNumber}`
    );

    return preferences;
  } catch (error) {
    console.error("Failed to restore preference version:", error);
    return null;
  }
}

/**
 * Delete a specific preference version
 */
export async function deletePreferenceVersion(
  userId: number,
  versionId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db
      .delete(preferenceVersions)
      .where(and(eq(preferenceVersions.id, versionId), eq(preferenceVersions.userId, userId)));

    return true;
  } catch (error) {
    console.error("Failed to delete preference version:", error);
    return false;
  }
}

/**
 * Clean up old versions, keeping only the latest MAX_VERSIONS_PER_USER
 */
export async function cleanupOldVersions(userId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Get all versions ordered by version number descending
    const allVersions = await db
      .select()
      .from(preferenceVersions)
      .where(eq(preferenceVersions.userId, userId))
      .orderBy(desc(preferenceVersions.versionNumber));

    // Delete versions beyond the limit
    if (allVersions.length > MAX_VERSIONS_PER_USER) {
      const versionsToDelete = allVersions.slice(MAX_VERSIONS_PER_USER);
      for (const version of versionsToDelete) {
        await db.delete(preferenceVersions).where(eq(preferenceVersions.id, version.id));
      }
    }
  } catch (error) {
    console.error("Failed to cleanup old versions:", error);
  }
}

/**
 * Calculate diff between two preference versions
 */
export function calculateVersionDiff(
  oldMetrics: string[],
  newMetrics: string[],
  oldFrequency: string,
  newFrequency: string,
  oldTime: { hour: number; minute: number },
  newTime: { hour: number; minute: number }
): VersionDiff {
  const oldSet = new Set(oldMetrics);
  const newSet = new Set(newMetrics);

  const metricsAdded = Array.from(newSet).filter((m) => !oldSet.has(m));
  const metricsRemoved = Array.from(oldSet).filter((m) => !newSet.has(m));

  const frequencyChanged = oldFrequency !== newFrequency;
  const timeChanged = oldTime.hour !== newTime.hour || oldTime.minute !== newTime.minute;

  return {
    metricsAdded,
    metricsRemoved,
    frequencyChanged,
    timeChanged,
    oldFrequency: frequencyChanged ? oldFrequency : undefined,
    newFrequency: frequencyChanged ? newFrequency : undefined,
    oldTime: timeChanged ? `${String(oldTime.hour).padStart(2, "0")}:${String(oldTime.minute).padStart(2, "0")}` : undefined,
    newTime: timeChanged ? `${String(newTime.hour).padStart(2, "0")}:${String(newTime.minute).padStart(2, "0")}` : undefined,
  };
}

/**
 * Format version timestamp for display
 */
export function formatVersionTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
