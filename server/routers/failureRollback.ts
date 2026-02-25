import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  trackReportFailure,
  getPendingRollbackSuggestions,
  getFailureHistory,
  applyRollbackSuggestion,
  dismissRollbackSuggestion,
  autoSuggestRollback,
  getFailureStats,
} from "../services/failureRollbackService";
import { restorePreferenceVersion } from "../services/preferenceVersionService";

export const failureRollbackRouter = router({
  /**
   * Track a report delivery failure
   */
  trackFailure: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
        propertyId: z.number().nullable().optional(),
        failureReason: z.enum(["email_delivery", "pdf_generation", "invalid_recipient", "network_error", "unknown"]),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const failure = await trackReportFailure(
        input.scheduleId,
        ctx.user.id,
        input.propertyId || null,
        input.failureReason,
        input.errorMessage
      );

      if (!failure) {
        return { success: false, error: "Failed to track failure" };
      }

      // Auto-suggest rollback
      const suggestion = await autoSuggestRollback(failure.id, ctx.user.id, input.scheduleId);

      return {
        success: true,
        failure,
        suggestion,
      };
    }),

  /**
   * Get pending rollback suggestions for current user
   */
  getPendingSuggestions: protectedProcedure.query(async ({ ctx }) => {
    return await getPendingRollbackSuggestions(ctx.user.id);
  }),

  /**
   * Get failure history for current user
   */
  getFailureHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getFailureHistory(ctx.user.id, input.limit);
    }),

  /**
   * Apply a rollback suggestion
   */
  applyRollback: protectedProcedure
    .input(
      z.object({
        suggestionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await applyRollbackSuggestion(input.suggestionId, ctx.user.id);

      if (!result.success) {
        return { success: false, error: result.message };
      }

      return {
        success: true,
        message: result.message,
      };
    }),

  /**
   * Dismiss a rollback suggestion
   */
  dismissSuggestion: protectedProcedure
    .input(
      z.object({
        suggestionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await dismissRollbackSuggestion(input.suggestionId, ctx.user.id);
      return { success };
    }),

  /**
   * Get failure statistics for current user
   */
  getFailureStats: protectedProcedure.query(async ({ ctx }) => {
    return await getFailureStats(ctx.user.id);
  }),
});
