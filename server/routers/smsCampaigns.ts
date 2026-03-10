import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignAnalytics,
  getCampaignDeliveryStatus,
  createTemplate,
  getUserTemplates,
  getCampaignRecipients,
} from '../services/smsCampaignService';

export const smsCampaignsRouter = router({
  /**
   * Create a new SMS campaign
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        messageTemplate: z.string().min(1).max(160),
        recipientIds: z.array(z.number()).min(1),
        scheduledTime: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createCampaign({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        messageTemplate: input.messageTemplate,
        recipientIds: input.recipientIds,
        scheduledTime: input.scheduledTime,
      });
    }),

  /**
   * Get campaign by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCampaignById(input.id);
    }),

  /**
   * List campaigns for current user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return listCampaigns(ctx.user.id, input.limit, input.offset);
    }),

  /**
   * Update campaign
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        messageTemplate: z.string().max(160).optional(),
        status: z.enum(['draft', 'scheduled', 'sent', 'cancelled']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return updateCampaign(input);
    }),

  /**
   * Delete campaign
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteCampaign(input.id);
    }),

  /**
   * Send campaign immediately
   */
  send: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return sendCampaign(input.id);
    }),

  /**
   * Get campaign analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCampaignAnalytics(input.id);
    }),

  /**
   * Get delivery status for campaign
   */
  getDeliveryStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCampaignDeliveryStatus(input.id);
    }),

  /**
   * Get recipients for campaign
   */
  getRecipients: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCampaignRecipients(input.id);
    }),

  /**
   * Create campaign template
   */
  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        messageTemplate: z.string().min(1).max(160),
        category: z.enum(['maintenance', 'payment', 'announcement', 'emergency', 'other']),
        description: z.string().optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createTemplate(
        ctx.user.id,
        input.name,
        input.messageTemplate,
        input.category,
        input.description,
        input.variables
      );
    }),

  /**
   * Get templates for current user
   */
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    return getUserTemplates(ctx.user.id);
  }),
});
