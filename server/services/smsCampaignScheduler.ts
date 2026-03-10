import { eq, and, lte, isNull } from 'drizzle-orm';
import { smsCampaigns } from '../../drizzle/schema';
import { getDb } from '../db';
import { sendCampaign } from './smsCampaignService';

/**
 * Check for scheduled campaigns that should be sent
 * This function should be called periodically (e.g., every 5 minutes)
 */
export async function checkAndSendScheduledCampaigns(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  try {
    const now = new Date();

    // Find campaigns that are scheduled and ready to send
    const scheduledCampaigns = await db
      .select()
      .from(smsCampaigns)
      .where(
        and(
          eq(smsCampaigns.status, 'scheduled'),
          lte(smsCampaigns.scheduledTime, now),
          isNull(smsCampaigns.sentAt)
        )
      );

    console.log(`Found ${scheduledCampaigns.length} campaigns ready to send`);

    // Send each campaign
    for (const campaign of scheduledCampaigns) {
      try {
        console.log(`Sending campaign ${campaign.id}: ${campaign.name}`);
        await sendCampaign(campaign.id);
        console.log(`Successfully sent campaign ${campaign.id}`);
      } catch (error) {
        console.error(`Error sending campaign ${campaign.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in checkAndSendScheduledCampaigns:', error);
  }
}

/**
 * Start the SMS campaign scheduler
 * Runs every 5 minutes to check for scheduled campaigns
 */
export function startCampaignScheduler(): ReturnType<typeof setInterval> {
  console.log('Starting SMS campaign scheduler (runs every 5 minutes)');

  // Run immediately on startup
  checkAndSendScheduledCampaigns();

  // Then run every 5 minutes
  const interval = setInterval(() => {
    checkAndSendScheduledCampaigns();
  }, 5 * 60 * 1000); // 5 minutes

  return interval;
}

/**
 * Stop the SMS campaign scheduler
 */
export function stopCampaignScheduler(interval: ReturnType<typeof setInterval>): void {
  clearInterval(interval);
  console.log('SMS campaign scheduler stopped');
}

export default {
  checkAndSendScheduledCampaigns,
  startCampaignScheduler,
  stopCampaignScheduler,
};
