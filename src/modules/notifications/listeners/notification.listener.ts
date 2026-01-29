import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '@/common/constants/config-keys';
import { Events } from '@/common/constants/events';
import { UserFollowedEvent } from '@/common/events/user-followed.event';
import { UserRegisteredEvent } from '@/common/events/user-registered.event';
import {
  EmailTemplate,
  WelcomeEmailPayload,
  NewFollowerEmailPayload,
} from '@/modules/mail/interfaces/email-payload.interface';
import {
  MAIL_QUEUE_NAME,
  MailJobName,
  MAIL_JOB_CONFIG,
} from '@/modules/mail/constants/mail-queue.constants';

/**
 * Notification Listener
 * Listens to domain events and enqueues email jobs
 * Implements idempotency via deterministic job IDs
 */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);
  private readonly appUrl: string;

  constructor(
    @InjectQueue(MAIL_QUEUE_NAME) private readonly mailQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    // APP_URL must be configured via ENV
    this.appUrl = this.configService.get<string>(ConfigKeys.APP.URL) || '';
  }

  /**
   * Enqueue email job with idempotency
   * @param jobName - Job name
   * @param payload - Email payload
   * @param jobId - Deterministic job ID for idempotency
   */
  private async enqueueEmail(
    jobName: MailJobName,
    payload: WelcomeEmailPayload | NewFollowerEmailPayload,
    jobId: string,
  ): Promise<void> {
    try {
      await this.mailQueue.add(jobName, payload, {
        jobId, // Idempotency key
        ...MAIL_JOB_CONFIG,
      } as JobsOptions);
    } catch (error) {
      // If job already exists, BullMQ will throw an error
      // We can safely ignore this as it means the job is already queued
      if (error instanceof Error && error.message.includes('already exists')) {
        this.logger.debug(`Job ${jobId} already exists - skipping`);
        return;
      }
      throw error;
    }
  }

  /**
   * Handle user registration event
   * Sends welcome email
   */
  @OnEvent(Events.USER_REGISTERED)
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(
      `[USER_REGISTERED] Handling event for user ${event.userId} (${event.username})`,
    );

    try {
      const payload: WelcomeEmailPayload = {
        to: event.email,
        template: EmailTemplate.WELCOME,
        subject: `Welcome to Blog Platform, ${event.username}!`,
        variables: {
          username: event.username,
          loginUrl: `${this.appUrl}/login`,
        },
      };

      // Idempotent job ID (BullMQ doesn't allow ':' in job IDs)
      const jobId = `welcome_${event.userId}`;

      await this.enqueueEmail(MailJobName.WELCOME_EMAIL, payload, jobId);

      this.logger.log(
        `[USER_REGISTERED] Welcome email queued successfully for user ${event.userId} with jobId: ${jobId}`,
      );
    } catch (error) {
      this.logger.error(
        `[USER_REGISTERED] Failed to queue welcome email for user ${event.userId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - we don't want to break the registration flow
    }
  }

  /**
   * Handle user followed event
   * Sends follower notification email
   */
  @OnEvent(Events.USER_FOLLOWED)
  async handleUserFollowed(event: UserFollowedEvent): Promise<void> {
    this.logger.log(
      `[USER_FOLLOWED] Handling event: ${event.followerUsername} (${event.followerId}) -> ${event.followingUsername} (${event.followingId})`,
    );

    try {
      const payload: NewFollowerEmailPayload = {
        to: event.followingEmail,
        template: EmailTemplate.NEW_FOLLOWER,
        subject: `${event.followerUsername} is now following you`,
        variables: {
          followerName: event.followerUsername,
          profileUrl: `${this.appUrl}/profiles/${event.followerUsername}`,
          authorName: event.followingUsername,
        },
      };

      // Idempotent job ID - prevents duplicate notifications
      const jobId = `follow_${event.followerId}_${event.followingId}`;

      await this.enqueueEmail(MailJobName.FOLLOW_NOTIFICATION, payload, jobId);

      this.logger.log(
        `[USER_FOLLOWED] Follower notification queued successfully for user ${event.followingId} with jobId: ${jobId}`,
      );
    } catch (error) {
      this.logger.error(
        `[USER_FOLLOWED] Failed to queue follower notification: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - we don't want to break the follow flow
    }
  }
}
