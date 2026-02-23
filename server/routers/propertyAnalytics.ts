import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { properties } from "../../drizzle/schema";
import {
  getVacancyTrends,
  getIncomeForecast,
  getMaintenanceCosts,
  getTenantPaymentBehavior,
  getPropertyPerformance,
  getTenantSatisfactionTrends,
} from "../services/propertyAnalytics";

export const propertyAnalyticsRouter = router({
  /**
   * Get vacancy trends over time
   */
  getVacancyTrends: publicProcedure
    .input(z.object({ months: z.number().min(1).max(60).default(12) }))
    .query(async ({ input }) => {
      return getVacancyTrends(input.months);
    }),

  /**
   * Get income forecast vs actual
   */
  getIncomeForecast: publicProcedure
    .input(z.object({ months: z.number().min(1).max(60).default(12) }))
    .query(async ({ input }) => {
      return getIncomeForecast(input.months);
    }),

  /**
   * Get maintenance cost breakdown
   */
  getMaintenanceCosts: publicProcedure.query(async () => {
      return getMaintenanceCosts();
    }),

  /**
   * Get tenant payment behavior
   */
  getTenantPaymentBehavior: publicProcedure.query(async () => {
      return getTenantPaymentBehavior();
    }),

  /**
   * Get property performance metrics
   */
  getPropertyPerformance: publicProcedure.query(async () => {
      return getPropertyPerformance();
    }),

  /**
   * Get tenant satisfaction trends over time, optionally filtered by property
   */
  getTenantSatisfactionTrends: publicProcedure
    .input(z.object({ months: z.number().min(1).max(60).default(12), propertyId: z.number().optional() }))
    .query(async ({ input }) => {
      return getTenantSatisfactionTrends(input.months, input.propertyId);
    }),

  getProperties: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];

      const props = await db
        .select({
          id: properties.id,
          name: properties.name,
        })
        .from(properties);

      return props;
    } catch (error) {
      console.error("Failed to get properties:", error);
      return [];
    }
  }),
});

