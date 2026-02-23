import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
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
   * Get tenant satisfaction trends over time
   */
  getTenantSatisfactionTrends: publicProcedure
    .input(z.object({ months: z.number().min(1).max(60).default(12) }))
    .query(async ({ input }) => {
      return getTenantSatisfactionTrends(input.months);
    }),
});

