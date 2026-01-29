import { Injectable, Logger, Inject } from '@nestjs/common';
import { SettingKeys } from '@/common/constants/settings';
import { PrismaService } from '@/database/prisma.service';
import { SettingsService } from '@/common/settings/settings.service';
import {
  renderWelcomeTemplate,
  renderNewFollowerTemplate,
  RenderedEmail,
} from './templates';
import {
  EmailPayload,
  EmailTemplate,
  EmailStatus,
} from './interfaces/email-payload.interface';
import {
  MAIL_PROVIDER,
  MailProvider,
} from './interfaces/mail-provider.interface';

/**
 * Mail Service
 * Handles email orchestration with template rendering, provider abstraction, and audit logging
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
  ) {}

  /**
   * Render email template with variables
   * @param payload - Email payload
   * @returns HTML and plain text content
   */
  private renderTemplate(payload: EmailPayload): RenderedEmail {
    switch (payload.template) {
      case EmailTemplate.WELCOME:
        return renderWelcomeTemplate(payload.variables);
      case EmailTemplate.NEW_FOLLOWER:
        return renderNewFollowerTemplate(payload.variables);
      default: {
        const _exhaustiveCheck: never = payload;
        throw new Error(`Unknown template: ${String(_exhaustiveCheck)}`);
      }
    }
  }

  /**
   * Log email attempt to database
   * Non-blocking - failures are logged but don't throw
   */
  private async logEmail(
    provider: string,
    jobId: string | undefined,
    payload: EmailPayload,
    status: EmailStatus,
    error: string | null,
  ): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          to: payload.to,
          template: payload.template,
          subject: payload.subject,
          jobId,
          status,
          error: error ? `${provider}: ${error}` : null,
        },
      });
    } catch (err) {
      // Log failure but don't throw - logging failure shouldn't break email flow
      this.logger.error(
        `Failed to log email attempt for ${payload.to}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Send email with template
   * Orchestrates rendering, provider dispatch and logging
   * @param payload - Email payload with template and variables
   * @param jobId - BullMQ job ID for tracking
   * @returns Success status
   */
  async sendEmail(payload: EmailPayload, jobId?: string): Promise<boolean> {
    const correlationId = jobId || `mail-${Date.now()}`;
    const providerName = this.mailProvider.getName();

    this.logger.log(
      `[${correlationId}] Orchestrating ${payload.template} email to ${payload.to} using ${providerName}`,
    );

    // 1. Check if mail sending is globally enabled
    const isEnabled = this.settingsService.getBoolean(
      SettingKeys.MAIL_SENDING_ENABLED,
      undefined,
      true,
    );

    if (!isEnabled) {
      this.logger.warn(
        `[${correlationId}] Mail sending is disabled - skipping`,
      );
      await this.logEmail(
        providerName,
        jobId,
        payload,
        EmailStatus.PENDING,
        'Globally disabled',
      );
      return false;
    }

    try {
      // 2. Render email content
      const content = this.renderTemplate(payload);

      // 3. Dispatch to abstracted provider
      const result = await this.mailProvider.send({
        to: payload.to,
        subject: payload.subject,
        content,
      });

      if (!result.success) {
        this.logger.error(
          `[${correlationId}] Failed to send email via ${providerName}: ${result.error}`,
        );
        await this.logEmail(
          providerName,
          jobId,
          payload,
          EmailStatus.FAILED,
          result.error || 'Unknown provider error',
        );
        return false;
      }

      // 4. Record success
      this.logger.log(
        `[${correlationId}] Email sent successfully via ${providerName} (ID: ${result.messageId})`,
      );
      await this.logEmail(providerName, jobId, payload, EmailStatus.SENT, null);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${correlationId}] Unexpected error in MailService: ${errorMessage}`,
      );

      // 5. Record technical failure
      await this.logEmail(
        providerName,
        jobId,
        payload,
        EmailStatus.FAILED,
        `TECHNICAL_ERROR: ${errorMessage}`,
      );
      throw error;
    }
  }
}
