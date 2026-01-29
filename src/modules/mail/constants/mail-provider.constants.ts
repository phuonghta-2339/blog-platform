/**
 * Mail Provider Constants
 * Centralized constants for mail provider types and configuration
 */

/**
 * Available mail provider types
 */
export enum MailProviderType {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
}

/**
 * Default mail provider
 */
export const DEFAULT_MAIL_PROVIDER = MailProviderType.MAILGUN;

/**
 * Mail provider display names
 */
export const MAIL_PROVIDER_NAMES: Record<MailProviderType, string> = {
  [MailProviderType.MAILGUN]: 'Mailgun',
  [MailProviderType.SENDGRID]: 'SendGrid',
};

/**
 * Mailgun API Constants
 */
export const MAILGUN_CONSTANTS = {
  USERNAME: 'api',
  SIMULATION_PREFIX: 'simulated-mailgun',
  MESSAGE_ID_PREFIX: 'mailgun',
  PREVIEW_LENGTH: 100,
} as const;

/**
 * SendGrid API Constants
 */
export const SENDGRID_CONSTANTS = {
  SIMULATION_PREFIX: 'simulated-sendgrid',
  MESSAGE_ID_PREFIX: 'sendgrid',
  PREVIEW_LENGTH: 100,
  UNKNOWN_MESSAGE_ID: 'unknown',
} as const;
