import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../mail.service';
import { EmailPayload } from '../interfaces/email-payload.interface';
import { MAIL_QUEUE_NAME } from '../constants/mail-queue.constants';

/**
 * Mail Worker
 * Processes email jobs from BullMQ queue
 * Implements retry logic and error handling
 */
@Processor(MAIL_QUEUE_NAME)
export class MailWorker extends WorkerHost {
  private readonly logger = new Logger(MailWorker.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  /**
   * Process email job
   * @param job - BullMQ job containing email payload
   */
  async process(job: Job<EmailPayload>): Promise<void> {
    const { id, name, data, attemptsMade } = job;

    this.logger.log(
      `Processing job ${id} (${name}) - Attempt ${attemptsMade + 1}`,
    );

    try {
      await this.mailService.sendEmail(data, id);
      this.logger.log(`Job ${id} completed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Job ${id} failed: ${errorMessage}`);
      throw error; // Re-throw to trigger BullMQ retry
    }
  }
}
