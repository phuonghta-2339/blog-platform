import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@/modules/mail/mail.service';
import { ReportsService } from '../reports.service';
import {
  REPORTS_QUEUE_NAME,
  ReportJobName,
} from '../constants/reports.constants';
import {
  EmailTemplate,
  AdminDailyReportPayload,
} from '@/modules/mail/interfaces/email-payload.interface';

@Processor(REPORTS_QUEUE_NAME)
export class ReportWorker extends WorkerHost {
  private readonly logger = new Logger(ReportWorker.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== ReportJobName.DAILY_ENGAGEMENT_STATS) {
      this.logger.warn(`Unknown job name: ${job.name}`);
      return;
    }

    this.logger.log(`Processing daily report job: ${job.id}`);

    try {
      // 1. Generate Report Data
      const data = await this.reportsService.getDailyEngagementStats();

      // 2. Get Recipients from ENV
      const recipients = this.configService
        .get<string>('ADMIN_REPORT_RECIPIENTS', '')
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (recipients.length === 0) {
        this.logger.warn(
          'No admin recipients configured (ADMIN_REPORT_RECIPIENTS)',
        );
        return;
      }

      // 3. Send Email to each admin
      // Note: In a larger system, we might queue individual email jobs.
      // Here we send directly as the recipient list is small (Admins only).
      await Promise.all(
        recipients.map((email) => {
          const payload: AdminDailyReportPayload = {
            to: email,
            template: EmailTemplate.ADMIN_DAILY_REPORT,
            subject: `[Admin] Daily Activity Report: ${data.date}`,
            variables: data,
          };
          return this.mailService.sendEmail(
            payload,
            `report-${data.date}-${email}`,
          );
        }),
      );

      this.logger.log(
        `Daily report sent to ${recipients.length} admins for date ${data.date}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process daily report: ${msg}`);
      throw error;
    }
  }
}
