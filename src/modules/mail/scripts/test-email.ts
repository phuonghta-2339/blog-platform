import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { MailService } from '@modules/mail/mail.service';
import {
  EmailPayload,
  EmailTemplate,
} from '@modules/mail/interfaces/email-payload.interface';
import {
  MAIL_TEST_TYPES,
  MAIL_TEST_CONFIG,
} from '@modules/mail/constants/mail-scripts.constants';

/**
 * Test Email Script
 * Tests email sending functionality and UI templates
 */

const logger = new Logger('TestEmailScript');

/**
 * Generic helper to execute an email test
 */
async function executeTest(
  mailService: MailService,
  payload: EmailPayload,
  testDescription: string,
): Promise<void> {
  logger.log(`🧪 Testing ${testDescription}...`);

  const jobName = `test-${payload.template}`;
  const success = await mailService.sendEmail(payload, jobName);

  if (success) {
    logger.log(`✅ ${testDescription} sent successfully!`);
  } else {
    throw new Error(`${testDescription} failed to send`);
  }
}

/**
 * Test welcome email template
 */
async function testWelcomeEmail(
  mailService: MailService,
  recipientEmail: string,
): Promise<void> {
  const config = MAIL_TEST_CONFIG.WELCOME;
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: config.subject,
    template: EmailTemplate.WELCOME,
    variables: {
      username: config.username,
      loginUrl: config.loginUrl,
    },
  };

  await executeTest(mailService, payload, 'Welcome Email');
}

/**
 * Test new follower email template
 */
async function testNewFollowerEmail(
  mailService: MailService,
  recipientEmail: string,
): Promise<void> {
  const config = MAIL_TEST_CONFIG.NEW_FOLLOWER;
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: config.subject,
    template: EmailTemplate.NEW_FOLLOWER,
    variables: {
      authorName: config.authorName,
      followerName: config.followerName,
      profileUrl: config.profileUrl,
    },
  };

  await executeTest(mailService, payload, 'New Follower Email');
}

/**
 * Main test function
 */
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0]?.toLowerCase();
  const recipientEmail = args[1] || 'test@example.com';

  const allowedTypes = Object.values(MAIL_TEST_TYPES).join('" or "');

  if (!testType) {
    logger.error(`❌ Please specify a test type: "${allowedTypes}"`);
    process.exit(1);
  }

  logger.log('='.repeat(60));
  logger.log('📧 Email Template Test Script');
  logger.log('='.repeat(60));
  logger.log(`Test Type: ${testType}`);
  logger.log(`Recipient: ${recipientEmail}`);
  logger.log('='.repeat(60));

  // Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const mailService = app.get(MailService);

    switch (testType) {
      case MAIL_TEST_TYPES.WELCOME:
        await testWelcomeEmail(mailService, recipientEmail);
        break;

      case MAIL_TEST_TYPES.NEW_FOLLOWER:
        await testNewFollowerEmail(mailService, recipientEmail);
        break;

      default:
        logger.error(
          `❌ Unknown test type: ${testType}. Use "${allowedTypes}"`,
        );
        process.exit(1);
    }

    logger.log('='.repeat(60));
    logger.log('✅ Test completed successfully!');
    logger.log('='.repeat(60));
  } catch (error) {
    logger.error(
      `❌ Test failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`Fatal error: ${message}`);
  process.exit(1);
});
