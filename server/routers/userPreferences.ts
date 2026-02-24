import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserPreferences,
  saveUserPreferences,
  deleteUserPreferences,
  shouldSyncFromServer,
  type SavedUserPreferences,
} from "../services/preferenceService";

const PreferenceInputSchema = z.object({
  metrics: z.object({
    selectedMetrics: z.array(z.string()),
    lastUpdated: z.number(),
  }),
  schedule: z.object({
    defaultFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"]),
    defaultHour: z.number().min(0).max(23),
    defaultMinute: z.number().min(0).max(59),
    defaultDayOfMonth: z.number().min(1).max(31),
    lastUpdated: z.number(),
  }),
});

export const userPreferencesRouter = router({
  /**
   * Get current user's preferences from server
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await getUserPreferences(ctx.user.id);
    return prefs || null;
  }),

  /**
   * Save or update current user's preferences
   */
  save: protectedProcedure
    .input(PreferenceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const success = await saveUserPreferences(ctx.user.id, input as SavedUserPreferences);
      return { success };
    }),

  /**
   * Delete current user's preferences
   */
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const success = await deleteUserPreferences(ctx.user.id);
    return { success };
  }),

  /**
   * Check if server preferences are newer than client version
   * Used for deciding whether to sync from server
   */
  shouldSync: protectedProcedure
    .input(
      z.object({
        clientLastUpdated: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const serverPrefs = await getUserPreferences(ctx.user.id);
      if (!serverPrefs) {
        return { shouldSync: false };
      }

      const needsSync = shouldSyncFromServer(
        input.clientLastUpdated,
        serverPrefs.metrics.lastUpdated
      );

      return { shouldSync: needsSync, serverPrefs: needsSync ? serverPrefs : null };
    }),
});
