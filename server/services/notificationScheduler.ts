import { checkOverduePayments, checkUpcomingRent, checkExpiringLeases } from './notificationService';

/**
 * Notification scheduler configuration
 */
export interface SchedulerConfig {
  enabled: boolean;
  checkOverduePaymentsInterval: number; // in milliseconds
  checkUpcomingRentInterval: number; // in milliseconds
  checkExpiringLeasesInterval: number; // in milliseconds
}

/**
 * Default scheduler configuration
 * - Check overdue payments every 6 hours
 * - Check upcoming rent every 24 hours
 * - Check expiring leases every 24 hours
 */
const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  checkOverduePaymentsInterval: 6 * 60 * 60 * 1000, // 6 hours
  checkUpcomingRentInterval: 24 * 60 * 60 * 1000, // 24 hours
  checkExpiringLeasesInterval: 24 * 60 * 60 * 1000, // 24 hours
};

let schedulerConfig: SchedulerConfig = DEFAULT_CONFIG;
let overduePaymentsTimer: NodeJS.Timeout | null = null;
let upcomingRentTimer: NodeJS.Timeout | null = null;
let expiringLeasesTimer: NodeJS.Timeout | null = null;

/**
 * Initialize the notification scheduler
 */
export function initializeScheduler(config: Partial<SchedulerConfig> = {}) {
  schedulerConfig = { ...DEFAULT_CONFIG, ...config };

  if (!schedulerConfig.enabled) {
    console.log('Notification scheduler is disabled');
    return;
  }

  console.log('Initializing notification scheduler...');
  startScheduler();
}

/**
 * Start the scheduler with configured intervals
 */
export function startScheduler() {
  if (!schedulerConfig.enabled) {
    console.log('Scheduler is disabled');
    return;
  }

  console.log('Starting notification scheduler...');

  // Schedule overdue payment checks
  overduePaymentsTimer = setInterval(async () => {
    try {
      console.log('[Scheduler] Checking for overdue payments...');
      await checkOverduePayments();
    } catch (error) {
      console.error('[Scheduler] Error checking overdue payments:', error);
    }
  }, schedulerConfig.checkOverduePaymentsInterval);

  // Schedule upcoming rent checks
  upcomingRentTimer = setInterval(async () => {
    try {
      console.log('[Scheduler] Checking for upcoming rent...');
      await checkUpcomingRent();
    } catch (error) {
      console.error('[Scheduler] Error checking upcoming rent:', error);
    }
  }, schedulerConfig.checkUpcomingRentInterval);

  // Schedule expiring leases checks
  expiringLeasesTimer = setInterval(async () => {
    try {
      console.log('[Scheduler] Checking for expiring leases...');
      await checkExpiringLeases();
    } catch (error) {
      console.error('[Scheduler] Error checking expiring leases:', error);
    }
  }, schedulerConfig.checkExpiringLeasesInterval);

  console.log('Notification scheduler started successfully');
  console.log(`- Overdue payments check: every ${schedulerConfig.checkOverduePaymentsInterval / 1000 / 60} minutes`);
  console.log(`- Upcoming rent check: every ${schedulerConfig.checkUpcomingRentInterval / 1000 / 60 / 60} hours`);
  console.log(`- Expiring leases check: every ${schedulerConfig.checkExpiringLeasesInterval / 1000 / 60 / 60} hours`);
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  console.log('Stopping notification scheduler...');

  if (overduePaymentsTimer) {
    clearInterval(overduePaymentsTimer);
    overduePaymentsTimer = null;
  }

  if (upcomingRentTimer) {
    clearInterval(upcomingRentTimer);
    upcomingRentTimer = null;
  }

  if (expiringLeasesTimer) {
    clearInterval(expiringLeasesTimer);
    expiringLeasesTimer = null;
  }

  console.log('Notification scheduler stopped');
}

/**
 * Restart the scheduler with new configuration
 */
export function restartScheduler(config: Partial<SchedulerConfig> = {}) {
  stopScheduler();
  initializeScheduler(config);
}

/**
 * Get current scheduler configuration
 */
export function getSchedulerConfig(): SchedulerConfig {
  return { ...schedulerConfig };
}

/**
 * Update scheduler configuration
 */
export function updateSchedulerConfig(config: Partial<SchedulerConfig>) {
  schedulerConfig = { ...schedulerConfig, ...config };

  if (schedulerConfig.enabled) {
    restartScheduler(schedulerConfig);
  } else {
    stopScheduler();
  }
}

/**
 * Run manual notification checks
 */
export async function runManualChecks() {
  console.log('Running manual notification checks...');

  try {
    await checkOverduePayments();
    await checkUpcomingRent();
    await checkExpiringLeases();
    console.log('Manual notification checks completed');
  } catch (error) {
    console.error('Error running manual checks:', error);
    throw error;
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    enabled: schedulerConfig.enabled,
    isRunning: overduePaymentsTimer !== null,
    config: schedulerConfig,
  };
}
