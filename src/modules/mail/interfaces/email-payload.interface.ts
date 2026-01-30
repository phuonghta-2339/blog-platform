/**
 * Email template types
 */
export enum EmailTemplate {
  WELCOME = 'welcome',
  NEW_FOLLOWER = 'new-follower',
  ADMIN_DAILY_REPORT = 'admin-daily-report',
}

/**
 * Email job status
 */
export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

/**
 * Base email job payload
 */
export interface BaseEmailPayload {
  to: string;
  template: EmailTemplate;
  subject: string;
}

/**
 * Welcome email payload
 */
export interface WelcomeEmailPayload extends BaseEmailPayload {
  template: EmailTemplate.WELCOME;
  variables: {
    username: string;
    loginUrl: string;
  };
}

/**
 * New follower email payload
 */
export interface NewFollowerEmailPayload extends BaseEmailPayload {
  template: EmailTemplate.NEW_FOLLOWER;
  variables: {
    followerName: string;
    profileUrl: string;
    authorName: string;
  };
}

/**
 * Admin Daily Report email payload
 */
export interface AdminDailyReportPayload extends BaseEmailPayload {
  template: EmailTemplate.ADMIN_DAILY_REPORT;
  variables: {
    date: string;
    totalLikesGained: number;
    topArticles: ReadonlyArray<{
      rank: number;
      title: string;
      allTimeLikes: number;
      likesGained: number; // Delta
    }>;
  };
}

/**
 * Union type for all email payloads
 */
export type EmailPayload =
  | WelcomeEmailPayload
  | NewFollowerEmailPayload
  | AdminDailyReportPayload;
