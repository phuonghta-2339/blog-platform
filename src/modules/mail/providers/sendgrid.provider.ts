import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';
import { ConfigKeys } from '@/common/constants/config-keys';
import {
  EmailResponse,
  MailProvider,
  SendMailOptions,
} from '../interfaces/mail-provider.interface';
import {
  MAIL_PROVIDER_NAMES,
  SENDGRID_CONSTANTS,
  MailProviderType,
} from '../constants/mail-provider.constants';

@Injectable()
export class SendGridProvider implements MailProvider {
  private readonly logger = new Logger(SendGridProvider.name);
  private readonly fromEmail: string;
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>(
      ConfigKeys.MAIL.SENDGRID_API_KEY,
    );
    // fromEmail must be configured via ENV
    this.fromEmail =
      this.configService.get<string>(ConfigKeys.MAIL.SENDGRID_FROM_EMAIL) || '';

    if (this.apiKey) {
      SendGrid.setApiKey(this.apiKey);
      this.logger.log('SendGrid API initialized');
    } else {
      this.logger.warn(
        'SendGrid API key not configured - emails will be simulated',
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
    const preview = htmlContent.substring(0, SENDGRID_CONSTANTS.PREVIEW_LENGTH);
    this.logger.debug(
      `[Simulated] Email to ${to} via SendGrid:\nSubject: ${subject}\nContent: ${preview}...`,
    );

    return {
      success: true,
      messageId: `${SENDGRID_CONSTANTS.SIMULATION_PREFIX}-${Date.now()}`,
    };
  }

  /**
   * Handle email sending errors
   * @param error - Error object
   * @returns Error response
   */
  private handleSendError(error: unknown): EmailResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`SendGrid delivery failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Get provider name
   */
  getName(): string {
    return MAIL_PROVIDER_NAMES[MailProviderType.SENDGRID];
  }

  /**
   * Send email via SendGrid
   * @param options - Email options
   * @returns Email response with success status and message ID
   */
  async send(options: SendMailOptions): Promise<EmailResponse> {
    const { to, from, subject, content } = options;
    const sender = from || this.fromEmail;

    // Simulation mode when API key is not configured
    if (!this.apiKey) {
      return this.simulateEmailSend(to, subject, content.html);
    }

    try {
      // Send email via SendGrid API
      const [response] = await SendGrid.send({
        to,
        from: sender,
        subject,
        html: content.html,
        text: content.text,
      });

      // Extract message ID from response headers
      const messageId = (response.headers as Record<string, unknown>)[
        'x-message-id'
      ] as string | string[] | undefined;

      const finalMessageId = Array.isArray(messageId)
        ? messageId[0]
        : (messageId ??
          `${SENDGRID_CONSTANTS.MESSAGE_ID_PREFIX}-${Date.now()}`);

      this.logger.log(
        `Email sent successfully via SendGrid to ${to} (ID: ${finalMessageId})`,
      );

      return {
        success: true,
        messageId: finalMessageId,
      };
    } catch (error) {
      return this.handleSendError(error);
    }
  }
}
