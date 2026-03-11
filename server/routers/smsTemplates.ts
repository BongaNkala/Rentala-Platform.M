import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { SmsTemplateService, CreateTemplateInput, UpdateTemplateInput } from "../services/smsTemplateService";

/**
 * SMS Templates Router
 * Manages reusable SMS announcement templates for landlords
 */
export const smsTemplatesRouter = router({
  /**
   * Create a new SMS template
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Template name is required"),
        description: z.string().optional(),
        messageTemplate: z
          .string()
          .min(1, "Message is required")
          .max(160, "Message must be 160 characters or less"),
        category: z.enum(["maintenance", "payment", "announcement", "emergency", "other"]),
        variables: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return SmsTemplateService.createTemplate(ctx.user.id, input as CreateTemplateInput);
    }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return SmsTemplateService.getTemplateById(ctx.user.id, input.id);
    }),

  /**
   * List all templates for the user
   */
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return SmsTemplateService.listTemplates(ctx.user.id, input);
    }),

  /**
   * Update template
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        messageTemplate: z
          .string()
          .max(160, "Message must be 160 characters or less")
          .optional(),
        category: z.enum(["maintenance", "payment", "announcement", "emergency", "other"]).optional(),
        variables: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return SmsTemplateService.updateTemplate(ctx.user.id, id, updateData as UpdateTemplateInput);
    }),

  /**
   * Delete template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return SmsTemplateService.deleteTemplate(ctx.user.id, input.id);
    }),

  /**
   * Duplicate template
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return SmsTemplateService.duplicateTemplate(ctx.user.id, input.id);
    }),

  /**
   * Get templates by category
   */
  getByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      return SmsTemplateService.getTemplatesByCategory(ctx.user.id, input.category);
    }),

  /**
   * Search templates
   */
  search: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ ctx, input }) => {
      return SmsTemplateService.searchTemplates(ctx.user.id, input.searchTerm);
    }),

  /**
   * Get template usage statistics
   */
  getStats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return SmsTemplateService.getTemplateStats(ctx.user.id, input.id);
    }),

  /**
   * Get all template categories
   */
  getCategories: protectedProcedure.query(async () => {
    return SmsTemplateService.getCategories();
  }),
});
