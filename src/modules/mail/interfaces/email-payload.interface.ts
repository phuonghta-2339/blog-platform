/**
 * Email template types
 */
export enum EmailTemplate {
  WELCOME = 'welcome',
  NEW_FOLLOWER = 'new-follower',
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
 * Union type for all email payloads
 */
export type EmailPayload = WelcomeEmailPayload | NewFollowerEmailPayload;
