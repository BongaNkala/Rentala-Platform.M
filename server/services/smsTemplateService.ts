import { getDb } from "../db";
import { smsCampaignTemplates, smsCampaigns } from "../../drizzle/schema";
import { eq, and, like, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  messageTemplate: string;
  category: "maintenance" | "payment" | "announcement" | "emergency" | "other";
  variables?: string[]; // JSON array of variable names
  isPublic?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  messageTemplate?: string;
  category?: "maintenance" | "payment" | "announcement" | "emergency" | "other";
  variables?: string[];
  isPublic?: boolean;
}

export class SmsTemplateService {
  /**
   * Create a new SMS template
   */
  static async createTemplate(userId: number, input: CreateTemplateInput) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    // Validate message length
    if (input.messageTemplate.length > 160) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Message template must be 160 characters or less",
      });
    }

    // Validate template name
    if (!input.name || input.name.trim().length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Template name is required",
      });
    }

    const result = await db
      .insert(smsCampaignTemplates)
      .values({
        userId,
        name: input.name.trim(),
        description: input.description?.trim(),
        messageTemplate: input.messageTemplate.trim(),
        category: input.category,
        variables: input.variables ? JSON.stringify(input.variables) : null,
        isPublic: input.isPublic ?? false,
      });

    return this.getTemplateById(userId, result[0].insertId);
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(userId: number, templateId: number) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const templates = await db
      .select()
      .from(smsCampaignTemplates)
      .where(
        and(
          eq(smsCampaignTemplates.id, templateId),
          eq(smsCampaignTemplates.userId, userId)
        )
      );

    const template = templates[0];

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    return {
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : [],
    };
  }

  /**
   * List all templates for a user
   */
  static async listTemplates(
    userId: number,
    filters?: {
      category?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const limit = filters?.limit ?? 20;
    const offset = filters?.offset ?? 0;

    // Build where clause based on filters
    let whereCondition: any = eq(smsCampaignTemplates.userId, userId);

    if (filters?.category) {
      whereCondition = and(
        whereCondition,
        eq(smsCampaignTemplates.category, filters.category as any)
      );
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereCondition = and(
        whereCondition,
        like(smsCampaignTemplates.name, searchTerm)
      );
    }

    const templates = await db
      .select()
      .from(smsCampaignTemplates)
      .where(whereCondition)
      .orderBy(desc(smsCampaignTemplates.createdAt))
      .limit(limit)
      .offset(offset);

    return templates.map((t: any) => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : [],
    }));
  }

  /**
   * Update template
   */
  static async updateTemplate(
    userId: number,
    templateId: number,
    input: UpdateTemplateInput
  ) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    // Verify ownership
    const existing = await db
      .select()
      .from(smsCampaignTemplates)
      .where(
        and(
          eq(smsCampaignTemplates.id, templateId),
          eq(smsCampaignTemplates.userId, userId)
        )
      );

    if (!existing || existing.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    // Validate message length if provided
    if (input.messageTemplate && input.messageTemplate.length > 160) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Message template must be 160 characters or less",
      });
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined)
      updateData.description = input.description?.trim();
    if (input.messageTemplate !== undefined)
      updateData.messageTemplate = input.messageTemplate.trim();
    if (input.category !== undefined) updateData.category = input.category;
    if (input.variables !== undefined)
      updateData.variables = JSON.stringify(input.variables);
    if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

    updateData.updatedAt = new Date();

    await db
      .update(smsCampaignTemplates)
      .set(updateData)
      .where(eq(smsCampaignTemplates.id, templateId));

    return this.getTemplateById(userId, templateId);
  }

  /**
   * Delete template
   */
  static async deleteTemplate(userId: number, templateId: number) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    // Verify ownership
    const templateResult = await db
      .select()
      .from(smsCampaignTemplates)
      .where(
        and(
          eq(smsCampaignTemplates.id, templateId),
          eq(smsCampaignTemplates.userId, userId)
        )
      );

    if (!templateResult || templateResult.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Template not found",
      });
    }

    await db
      .delete(smsCampaignTemplates)
      .where(eq(smsCampaignTemplates.id, templateId));

    return { success: true };
  }

  /**
   * Duplicate template
   */
  static async duplicateTemplate(userId: number, templateId: number) {
    const template = await this.getTemplateById(userId, templateId);

    return this.createTemplate(userId, {
      name: `${template.name} (Copy)`,
      description: template.description || undefined,
      messageTemplate: template.messageTemplate,
      category: template.category,
      variables: template.variables || [],
      isPublic: false, // Duplicates are private by default
    });
  }

  /**
   * Get template usage statistics
   */
  static async getTemplateStats(userId: number, templateId: number) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    // Verify ownership
    await this.getTemplateById(userId, templateId);

    // Get campaigns that used this template (if we add template_id to campaigns)
    // For now, return basic stats
    return {
      templateId,
      usageCount: 0, // Will be updated when campaigns reference templates
      lastUsed: null,
      totalCharacters: 0,
    };
  }

  /**
   * Get templates by category
   */
  static async getTemplatesByCategory(
    userId: number,
    category: string
  ) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const templates = await db
      .select()
      .from(smsCampaignTemplates)
      .where(
        and(
          eq(smsCampaignTemplates.userId, userId),
          eq(smsCampaignTemplates.category, category as any)
        )
      )
      .orderBy(desc(smsCampaignTemplates.createdAt));

    return templates.map((t: any) => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : [],
    }));
  }

  /**
   * Search templates
   */
  static async searchTemplates(userId: number, searchTerm: string) {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    const term = `%${searchTerm}%`;

    const templates = await db
      .select()
      .from(smsCampaignTemplates)
      .where(
        and(
          eq(smsCampaignTemplates.userId, userId),
          like(smsCampaignTemplates.name, term)
        )
      )
      .orderBy(desc(smsCampaignTemplates.createdAt));

    return templates.map((t: any) => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : [],
    }));
  }

  /**
   * Get all template categories
   */
  static async getCategories() {
    return [
      { id: "maintenance", label: "Maintenance" },
      { id: "payment", label: "Payment" },
      { id: "announcement", label: "Announcement" },
      { id: "emergency", label: "Emergency" },
      { id: "other", label: "Other" },
    ];
  }
}
