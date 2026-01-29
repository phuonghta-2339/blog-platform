/**
 * Mail queue job names
 */
export enum MailJobName {
  WELCOME_EMAIL = 'WELCOME_EMAIL',
  FOLLOW_NOTIFICATION = 'FOLLOW_NOTIFICATION',
}

/**
 * Mail queue configuration
 */
export const MAIL_QUEUE_NAME = 'mail_queue';

/**
 * BullBoard configuration
 */
export const BULL_BOARD_CONFIG = {
  UI_PATH: '/admin/queues/ui',
};

/**
 * Job retry configuration
 * Exponential backoff: attempt 1 = 10s, attempt 2 = 20s, attempt 3 = 40s
 */
export const MAIL_JOB_CONFIG = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 10000, // Starting delay: 10 seconds
  },
  removeOnComplete: {
    age: 86400, // Keep completed jobs for 24 hours
    count: 1000, // Keep last 1000 completed jobs
  },
  removeOnFail: false, // Keep failed jobs for inspection
};
