/**
 * Mail configuration
 * Supports multiple email providers with Mailgun as primary
 * All sensitive values (API keys, sender emails) must come from ENV
 */

import { registerAs } from '@nestjs/config';
import { MailProviderType } from '@/common/constants/providers';

export const mailConfig = registerAs('mail', () => ({
  // Mailgun (Primary Provider)
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || '',
    // fromEmail is validated by schema in production
    fromEmail: process.env.MAILGUN_FROM_EMAIL || '',
  },
  // SendGrid (Optional/Fallback Provider)
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    // fromEmail is validated by schema in production
    fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
  },
  // Provider selection
  provider: (
    process.env.MAIL_PROVIDER || MailProviderType.MAILGUN
  ).toLowerCase(),
  // Admin recipients for reports
  adminRecipients:
    process.env.ADMIN_REPORT_RECIPIENTS?.split(',').filter(Boolean) || [],
}));
