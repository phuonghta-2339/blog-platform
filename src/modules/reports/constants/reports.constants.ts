/**
 * Reports Queue Name
 */
export const REPORTS_QUEUE_NAME = 'admin_report_queue';

/**
 * Report Job Names
 */
export const ReportJobName = {
  DAILY_ENGAGEMENT_STATS: 'DAILY_ENGAGEMENT_STATS',
};

/**
 * Job Schedule Constants
 */
export const CRON_DAILY_MIDNIGHT = '0 0 * * *';

/**
 * Job retry configuration
 */
export const REPORT_JOB_CONFIG = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: {
    age: 86400 * 7, // Keep for 7 days
  },
  removeOnFail: false,
};

/**
 * Configuration Keys
 */
export const REPORT_CONFIG_KEYS = {
  ADMIN_REPORT_CRON: 'ADMIN_REPORT_CRON',
} as const;

/**
 * Job IDs for repeatable jobs
 */
export const REPORT_JOB_IDS = {
  ADMIN_REPORT_DAILY: 'admin-report-daily',
} as const;
