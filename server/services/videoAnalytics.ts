import { getDb } from "../db";
import { videoAnalytics, type InsertVideoAnalytics } from "../../drizzle/schema";
import { gte, sql } from "drizzle-orm";

/**
 * Video Analytics Service
 * Tracks which video formats are used by visitors and collects device/browser information
 */

export interface VideoFormatData {
  format: "webm" | "hevc" | "mp4" | "image";
  loadTime?: number;
  playbackTime?: number;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: "desktop" | "tablet" | "mobile";
  screenResolution?: string;
  connectionSpeed?: string;
  pageUrl?: string;
  referrer?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
}

/**
 * Record a video format usage event
 */
export async function trackVideoFormat(
  sessionId: string,
  userId: number | null,
  data: VideoFormatData
) {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    const record: InsertVideoAnalytics = {
      sessionId,
      userId,
      format: data.format,
      loadTime: data.loadTime,
      playbackTime: data.playbackTime,
      browserName: data.browserName,
      browserVersion: data.browserVersion,
      osName: data.osName,
      osVersion: data.osVersion,
      deviceType: data.deviceType || "desktop",
      screenResolution: data.screenResolution,
      connectionSpeed: data.connectionSpeed,
      pageUrl: data.pageUrl,
      referrer: data.referrer,
      ipAddress: data.ipAddress,
      country: data.country,
      region: data.region,
    };

    await db.insert(videoAnalytics).values(record);
    return { success: true, id: record.sessionId };
  } catch (error) {
    console.error("Failed to track video format:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get format usage statistics
 */
export async function getFormatStats(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        format: videoAnalytics.format,
        count: sql<number>`COUNT(*) as count`,
        avgLoadTime: sql<number>`AVG(loadTime) as avgLoadTime`,
        avgPlaybackTime: sql<number>`AVG(playbackTime) as avgPlaybackTime`,
      })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate))
      .groupBy(videoAnalytics.format);

    return stats;
  } catch (error) {
    console.error("Failed to get format stats:", error);
    return [];
  }
}

/**
 * Get device type breakdown
 */
export async function getDeviceTypeStats(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        deviceType: videoAnalytics.deviceType,
        format: videoAnalytics.format,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate))
      .groupBy(videoAnalytics.deviceType, videoAnalytics.format);

    return stats;
  } catch (error) {
    console.error("Failed to get device stats:", error);
    return [];
  }
}

/**
 * Get browser breakdown
 */
export async function getBrowserStats(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        browserName: videoAnalytics.browserName,
        format: videoAnalytics.format,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate))
      .groupBy(videoAnalytics.browserName, videoAnalytics.format);

    return stats;
  } catch (error) {
    console.error("Failed to get browser stats:", error);
    return [];
  }
}

/**
 * Get OS breakdown
 */
export async function getOSStats(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        osName: videoAnalytics.osName,
        format: videoAnalytics.format,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate))
      .groupBy(videoAnalytics.osName, videoAnalytics.format);

    return stats;
  } catch (error) {
    console.error("Failed to get OS stats:", error);
    return [];
  }
}

/**
 * Get connection speed breakdown
 */
export async function getConnectionSpeedStats(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        connectionSpeed: videoAnalytics.connectionSpeed,
        format: videoAnalytics.format,
        count: sql<number>`COUNT(*) as count`,
        avgLoadTime: sql<number>`AVG(loadTime) as avgLoadTime`,
      })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate))
      .groupBy(videoAnalytics.connectionSpeed, videoAnalytics.format);

    return stats;
  } catch (error) {
    console.error("Failed to get connection speed stats:", error);
    return [];
  }
}

/**
 * Get geographic breakdown
 */
export async function getGeographicStats(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        country: videoAnalytics.country,
        region: videoAnalytics.region,
        format: videoAnalytics.format,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate))
      .groupBy(videoAnalytics.country, videoAnalytics.region, videoAnalytics.format);

    return stats;
  } catch (error) {
    console.error("Failed to get geographic stats:", error);
    return [];
  }
}

/**
 * Get time series data for format usage
 */
export async function getFormatTimeSeriesStats(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        date: sql<string>`DATE(createdAt) as date`,
        format: videoAnalytics.format,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate))
      .groupBy(sql`DATE(createdAt)`, videoAnalytics.format)
      .orderBy(sql`DATE(createdAt)`);

    return stats;
  } catch (error) {
    console.error("Failed to get time series stats:", error);
    return [];
  }
}

/**
 * Get total analytics summary
 */
export async function getAnalyticsSummary(days: number = 30) {
  try {
    const db = await getDb();
    if (!db) {
      return {
        totalEvents: 0,
        dateRange: { start: new Date(), end: new Date() },
        formatStats: [],
        deviceStats: [],
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalCount = await db
      .select({ count: sql<number>`COUNT(*) as count` })
      .from(videoAnalytics)
      .where(gte(videoAnalytics.createdAt, startDate));

    const formatStats = await getFormatStats(days);
    const deviceStats = await getDeviceTypeStats(days);

    return {
      totalEvents: totalCount[0]?.count || 0,
      dateRange: { start: startDate, end: new Date() },
      formatStats,
      deviceStats,
    };
  } catch (error) {
    console.error("Failed to get analytics summary:", error);
    return {
      totalEvents: 0,
      dateRange: { start: new Date(), end: new Date() },
      formatStats: [],
      deviceStats: [],
    };
  }
}
