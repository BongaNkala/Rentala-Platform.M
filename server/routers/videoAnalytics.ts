import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  trackVideoFormat,
  getFormatStats,
  getDeviceTypeStats,
  getBrowserStats,
  getOSStats,
  getConnectionSpeedStats,
  getGeographicStats,
  getFormatTimeSeriesStats,
  getAnalyticsSummary,
  type VideoFormatData,
} from "../services/videoAnalytics";

export const videoAnalyticsRouter = router({
  /**
   * Track a video format usage event
   */
  track: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        userId: z.number().nullable(),
        format: z.enum(["webm", "hevc", "mp4", "image"]),
        loadTime: z.number().optional(),
        playbackTime: z.number().optional(),
        browserName: z.string().optional(),
        browserVersion: z.string().optional(),
        osName: z.string().optional(),
        osVersion: z.string().optional(),
        deviceType: z.enum(["desktop", "tablet", "mobile"]).optional(),
        screenResolution: z.string().optional(),
        connectionSpeed: z.string().optional(),
        pageUrl: z.string().optional(),
        referrer: z.string().optional(),
        ipAddress: z.string().optional(),
        country: z.string().optional(),
        region: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: VideoFormatData = {
        format: input.format,
        loadTime: input.loadTime,
        playbackTime: input.playbackTime,
        browserName: input.browserName,
        browserVersion: input.browserVersion,
        osName: input.osName,
        osVersion: input.osVersion,
        deviceType: input.deviceType,
        screenResolution: input.screenResolution,
        connectionSpeed: input.connectionSpeed,
        pageUrl: input.pageUrl,
        referrer: input.referrer,
        ipAddress: input.ipAddress,
        country: input.country,
        region: input.region,
      };

      return trackVideoFormat(input.sessionId, input.userId, data);
    }),

  /**
   * Get format usage statistics
   */
  getFormatStats: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getFormatStats(input.days);
    }),

  /**
   * Get device type breakdown
   */
  getDeviceTypeStats: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getDeviceTypeStats(input.days);
    }),

  /**
   * Get browser breakdown
   */
  getBrowserStats: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getBrowserStats(input.days);
    }),

  /**
   * Get OS breakdown
   */
  getOSStats: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getOSStats(input.days);
    }),

  /**
   * Get connection speed breakdown
   */
  getConnectionSpeedStats: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getConnectionSpeedStats(input.days);
    }),

  /**
   * Get geographic breakdown
   */
  getGeographicStats: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getGeographicStats(input.days);
    }),

  /**
   * Get time series data
   */
  getFormatTimeSeriesStats: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getFormatTimeSeriesStats(input.days);
    }),

  /**
   * Get analytics summary
   */
  getSummary: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return getAnalyticsSummary(input.days);
    }),
});
