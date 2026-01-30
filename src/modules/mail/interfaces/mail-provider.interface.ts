import { RenderedEmail } from '../templates';

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendMailOptions {
  to: string;
  from?: string;
  subject: string;
  content: RenderedEmail;
}

export interface MailProvider {
  send(options: SendMailOptions): Promise<EmailResponse>;
  getName(): string;
}

export const MAIL_PROVIDER = 'MAIL_PROVIDER';
