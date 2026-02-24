import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getPreferenceVersions,
  restorePreferenceVersion,
  deletePreferenceVersion,
  calculateVersionDiff,
  formatVersionTimestamp,
} from "../services/preferenceVersionService";

export const preferenceVersionsRouter = router({
  /**
   * Get all preference versions for current user
   */
  getVersions: protectedProcedure.query(async ({ ctx }) => {
    const versions = await getPreferenceVersions(ctx.user.id);
    return versions.map((v) => ({
      ...v,
      createdAt: formatVersionTimestamp(v.createdAt),
    }));
  }),

  /**
   * Restore a specific preference version
   */
  restore: protectedProcedure
    .input(
      z.object({
        versionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restored = await restorePreferenceVersion(ctx.user.id, input.versionId);
      return {
        success: restored !== null,
        preferences: restored,
      };
    }),

  /**
   * Delete a specific preference version
   */
  delete: protectedProcedure
    .input(
      z.object({
        versionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await deletePreferenceVersion(ctx.user.id, input.versionId);
      return { success };
    }),

  /**
   * Get diff between two versions
   */
  getDiff: protectedProcedure
    .input(
      z.object({
        oldMetrics: z.array(z.string()),
        newMetrics: z.array(z.string()),
        oldFrequency: z.string(),
        newFrequency: z.string(),
        oldHour: z.number(),
        oldMinute: z.number(),
        newHour: z.number(),
        newMinute: z.number(),
      })
    )
    .query(({ input }) => {
      const diff = calculateVersionDiff(
        input.oldMetrics,
        input.newMetrics,
        input.oldFrequency,
        input.newFrequency,
        { hour: input.oldHour, minute: input.oldMinute },
        { hour: input.newHour, minute: input.newMinute }
      );
      return diff;
    }),
});
