import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { ConfigKeys } from '@/common/constants/config-keys';
import {
  EmailResponse,
  MailProvider,
  SendMailOptions,
} from '../interfaces/mail-provider.interface';
import {
  MAIL_PROVIDER_NAMES,
  MAILGUN_CONSTANTS,
  MailProviderType,
} from '../constants/mail-provider.constants';

/**
 * Mailgun message data interface
 * Defines the structure for email messages sent via Mailgun
 */
interface MailgunMessageData {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}

/**
 * Mailgun API response interface
 * Defines the structure of the response from Mailgun API
 */
interface MailgunApiResponse {
  id: string;
  message: string;
}

/**
 * Mailgun client interface
 * Defines the structure of the Mailgun client with typed methods
 */
interface MailgunClient {
  messages: {
    create(
      domain: string,
      data: MailgunMessageData,
    ): Promise<MailgunApiResponse>;
  };
}

/**
 * Mailgun Email Provider
 * Primary email service provider using Mailgun API
 */
@Injectable()
export class MailgunProvider implements MailProvider {
  private readonly logger = new Logger(MailgunProvider.name);
  private readonly fromEmail: string;
  private readonly apiKey: string | undefined;
  private readonly domain: string | undefined;
  private readonly client: MailgunClient | null = null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>(
      ConfigKeys.MAIL.MAILGUN_API_KEY,
    );
    this.domain = this.configService.get<string>(
      ConfigKeys.MAIL.MAILGUN_DOMAIN,
    );
    // fromEmail must be configured via ENV
    this.fromEmail =
      this.configService.get<string>(ConfigKeys.MAIL.MAILGUN_FROM_EMAIL) || '';

    // Initialize Mailgun client if credentials are provided
    if (this.apiKey && this.domain) {
      try {
        const mailgun = new Mailgun(FormData);
        this.client = mailgun.client({
          username: MAILGUN_CONSTANTS.USERNAME,
          key: this.apiKey,
        }) as MailgunClient;

        this.logger.log(
          `Mailgun client initialized for domain: ${this.domain}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to initialize Mailgun client: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      this.logger.warn(
        'Mailgun credentials not configured - emails will be simulated',
      );
    }
  }

  /**
   * Simulate email sending for development/testing
   * @param to - Recipient email
   * @param subject - Email subject
   * @param htmlContent - HTML content
   * @returns Simulated email response
   */
  private simulateEmailSend(
    to: string,
    subject: string,
    htmlContent: string,
  ): EmailResponse {
    const preview = htmlContent.substring(0, MAILGUN_CONSTANTS.PREVIEW_LENGTH);
    this.logger.debug(
      `[Simulated] Email to ${to} via Mailgun:\nSubject: ${subject}\nContent: ${preview}...`,
    );

    return {
      success: true,
      messageId: `${MAILGUN_CONSTANTS.SIMULATION_PREFIX}-${Date.now()}`,
    };
  }

  /**
   * Handle email sending errors
   * @param error - Error object
   * @returns Error response
   */
  private handleSendError(error: unknown): EmailResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`Mailgun delivery failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Get provider name
   */
  getName(): string {
    return MAIL_PROVIDER_NAMES[MailProviderType.MAILGUN];
  }

  /**
   * Send email via Mailgun
   * @param options - Email options
   * @returns Email response with success status and message ID
   */
  async send(options: SendMailOptions): Promise<EmailResponse> {
    const { to, from, subject, content } = options;
    const sender = from || this.fromEmail;

    // Simulation mode when credentials are not configured
    if (!this.client || !this.domain) {
      return this.simulateEmailSend(to, subject, content.html);
    }

    try {
      // Prepare Mailgun message data
      const messageData: MailgunMessageData = {
        from: sender,
        to: [to],
        subject,
        html: content.html,
        text: content.text,
      };

      // Send email via Mailgun API with proper typing
      const response = await this.client.messages.create(
        this.domain,
        messageData,
      );

      // Extract message ID from response
      const messageId =
        response.id || `${MAILGUN_CONSTANTS.MESSAGE_ID_PREFIX}-${Date.now()}`;

      this.logger.log(
        `Email sent successfully via Mailgun to ${to} (ID: ${messageId})`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      return this.handleSendError(error);
    }
  }
}
