import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import {
  smsCampaigns,
  smsCampaignRecipients,
  smsCampaignDelivery,
  smsCampaignTemplates,
  tenants,
  leases,
  units,
  properties,
  payments,
} from '../../drizzle/schema';
import { getDb } from '../db';
import {
  sendBulkSMS,
  validatePhoneNumber,
  formatPhoneNumber,
} from './smsNotificationService';

export interface CreateCampaignInput {
  userId: number;
  name: string;
  description?: string;
  messageTemplate: string;
  recipientIds: number[]; // Tenant IDs
  scheduledTime?: Date;
}

export interface UpdateCampaignInput {
  id: number;
  name?: string;
  description?: string;
  messageTemplate?: string;
  status?: 'draft' | 'scheduled' | 'sent' | 'cancelled';
}

export interface CampaignAnalytics {
  campaignId: number;
  totalRecipients: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  deliveryRate: number;
  successRate: number;
}

/**
 * Create a new SMS campaign
 */
export async function createCampaign(input: CreateCampaignInput) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Validate message length (SMS limit is 160 characters)
    if (input.messageTemplate.length > 160) {
      throw new Error('Message exceeds 160 character SMS limit');
    }

    // Create campaign
    const result = await db.insert(smsCampaigns).values({
      userId: input.userId,
      name: input.name,
      description: input.description,
      messageTemplate: input.messageTemplate,
      status: input.scheduledTime ? 'scheduled' : 'draft',
      recipientCount: input.recipientIds.length,
      scheduledTime: input.scheduledTime,
    });

    const campaignId = result[0].insertId;

    // Get tenant phone numbers
    const tenantList = await db
      .select({
        id: tenants.id,
        phone: tenants.phone,
      })
      .from(tenants)
      .where(inArray(tenants.id, input.recipientIds));

    // Add recipients
    const recipients = tenantList
      .filter((t) => t.phone && validatePhoneNumber(t.phone))
      .map((t) => ({
        campaignId,
        tenantId: t.id,
        phoneNumber: formatPhoneNumber(t.phone!),
        status: 'pending' as const,
      }));

    if (recipients.length > 0) {
      await db.insert(smsCampaignRecipients).values(recipients);
    }

    return {
      id: campaignId,
      recipientCount: recipients.length,
      status: input.scheduledTime ? 'scheduled' : 'draft',
    };
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const campaign = await db
      .select()
      .from(smsCampaigns)
      .where(eq(smsCampaigns.id, campaignId))
      .limit(1);

    return campaign[0] || null;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }
}

/**
 * List campaigns for a user
 */
export async function listCampaigns(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const campaigns = await db
      .select()
      .from(smsCampaigns)
      .where(eq(smsCampaigns.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(limit)
      .offset(offset);

    return campaigns;
  } catch (error) {
    console.error('Error listing campaigns:', error);
    throw error;
  }
}

/**
 * Update campaign
 */
export async function updateCampaign(input: UpdateCampaignInput) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const updates: Record<string, any> = {};

    if (input.name) updates.name = input.name;
    if (input.description) updates.description = input.description;
    if (input.messageTemplate) {
      if (input.messageTemplate.length > 160) {
        throw new Error('Message exceeds 160 character SMS limit');
      }
      updates.messageTemplate = input.messageTemplate;
    }
    if (input.status) updates.status = input.status;

    await db
      .update(smsCampaigns)
      .set(updates)
      .where(eq(smsCampaigns.id, input.id));

    return { success: true };
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Delete delivery logs
    await db
      .delete(smsCampaignDelivery)
      .where(eq(smsCampaignDelivery.campaignId, campaignId));

    // Delete recipients
    await db
      .delete(smsCampaignRecipients)
      .where(eq(smsCampaignRecipients.campaignId, campaignId));

    // Delete campaign
    await db.delete(smsCampaigns).where(eq(smsCampaigns.id, campaignId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

/**
 * Send campaign immediately
 */
export async function sendCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Get campaign and recipients
    const campaign = await getCampaignById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const recipients = await db
      .select()
      .from(smsCampaignRecipients)
      .where(
        and(
          eq(smsCampaignRecipients.campaignId, campaignId),
          eq(smsCampaignRecipients.status, 'pending')
        )
      );

    if (recipients.length === 0) {
      throw new Error('No pending recipients');
    }

    // Prepare SMS messages
    const messages = recipients.map((r) => ({
      phoneNumber: r.phoneNumber,
      message: campaign.messageTemplate,
    }));

    // Send bulk SMS
    const results = await sendBulkSMS(messages);

    // Update delivery logs and recipient status
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const result = results[i];
      const recipient = recipients[i];

      if (result.success) {
        sentCount++;
        await db
          .update(smsCampaignRecipients)
          .set({
            status: 'sent',
            sentAt: new Date(),
          })
          .where(eq(smsCampaignRecipients.id, recipient.id));

        // Log delivery
        await db.insert(smsCampaignDelivery).values({
          campaignId,
          recipientId: recipient.id,
          messageId: result.messageId,
          status: 'sent',
          sentAt: new Date(),
        });
      } else {
        failedCount++;
        await db
          .update(smsCampaignRecipients)
          .set({
            status: 'failed',
            failureReason: result.error,
          })
          .where(eq(smsCampaignRecipients.id, recipient.id));

        // Log delivery failure
        await db.insert(smsCampaignDelivery).values({
          campaignId,
          recipientId: recipient.id,
          status: 'failed',
          errorMessage: result.error,
        });
      }
    }

    // Update campaign status
    await db
      .update(smsCampaigns)
      .set({
        status: 'sent',
        sentAt: new Date(),
        sentCount,
        failedCount,
      })
      .where(eq(smsCampaigns.id, campaignId));

    return {
      success: true,
      sentCount,
      failedCount,
      totalCount: recipients.length,
    };
  } catch (error) {
    console.error('Error sending campaign:', error);
    throw error;
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: number): Promise<CampaignAnalytics> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const recipients = await db
      .select()
      .from(smsCampaignRecipients)
      .where(eq(smsCampaignRecipients.campaignId, campaignId));

    const sent = recipients.filter((r) => r.status === 'sent').length;
    const delivered = recipients.filter((r) => r.status === 'delivered').length;
    const failed = recipients.filter((r) => r.status === 'failed').length;
    const bounced = recipients.filter((r) => r.status === 'bounced').length;

    const totalRecipients = recipients.length;
    const deliveryRate = totalRecipients > 0 ? (delivered / totalRecipients) * 100 : 0;
    const successRate = totalRecipients > 0 ? ((sent + delivered) / totalRecipients) * 100 : 0;

    return {
      campaignId,
      totalRecipients,
      sent,
      delivered,
      failed,
      bounced,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    throw error;
  }
}

/**
 * Get delivery status for campaign
 */
export async function getCampaignDeliveryStatus(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const deliveries = await db
      .select()
      .from(smsCampaignDelivery)
      .where(eq(smsCampaignDelivery.campaignId, campaignId));

    return deliveries;
  } catch (error) {
    console.error('Error getting delivery status:', error);
    throw error;
  }
}

/**
 * Create campaign template
 */
export async function createTemplate(
  userId: number,
  name: string,
  messageTemplate: string,
  category: 'maintenance' | 'payment' | 'announcement' | 'emergency' | 'other',
  description?: string,
  variables?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    if (messageTemplate.length > 160) {
      throw new Error('Message exceeds 160 character SMS limit');
    }

    const result = await db.insert(smsCampaignTemplates).values({
      userId,
      name,
      description,
      messageTemplate,
      category,
      variables: variables ? JSON.stringify(variables) : null,
    });

    return { id: result[0].insertId, success: true };
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Get templates for user
 */
export async function getUserTemplates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const templates = await db
      .select()
      .from(smsCampaignTemplates)
      .where(eq(smsCampaignTemplates.userId, userId));

    return templates.map((t) => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : [],
    }));
  } catch (error) {
    console.error('Error getting templates:', error);
    throw error;
  }
}

/**
 * Get recipients for campaign with details
 */
export async function getCampaignRecipients(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const recipients = await db
      .select({
        id: smsCampaignRecipients.id,
        tenantId: smsCampaignRecipients.tenantId,
        phoneNumber: smsCampaignRecipients.phoneNumber,
        status: smsCampaignRecipients.status,
        sentAt: smsCampaignRecipients.sentAt,
        deliveredAt: smsCampaignRecipients.deliveredAt,
        failureReason: smsCampaignRecipients.failureReason,
        tenantName: tenants.firstName,
        tenantLastName: tenants.lastName,
      })
      .from(smsCampaignRecipients)
      .leftJoin(tenants, eq(smsCampaignRecipients.tenantId, tenants.id))
      .where(eq(smsCampaignRecipients.campaignId, campaignId));

    return recipients;
  } catch (error) {
    console.error('Error getting campaign recipients:', error);
    throw error;
  }
}

export default {
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
};
