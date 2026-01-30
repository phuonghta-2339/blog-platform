import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import {
  renderWelcomeTemplate,
  renderNewFollowerTemplate,
  renderAdminDailyReportTemplate,
} from '@modules/mail/templates';
import {
  MAIL_PREVIEW_TYPES,
  MAIL_PREVIEW_CONFIG,
  MAIL_PREVIEW_DIR,
} from '@modules/mail/constants/mail-scripts.constants';

/**
 * Preview Email Templates Script
 * Generates HTML files for previewing email templates in browser
 */

const logger = new Logger('PreviewTemplatesScript');

const PREVIEW_DIR = join(process.cwd(), MAIL_PREVIEW_DIR);

/**
 * Save preview HTML to file
 */
function savePreview(filename: string, html: string): string {
  const filePath = join(PREVIEW_DIR, filename);
  writeFileSync(filePath, html, 'utf-8');
  logger.log(`✅ Template preview saved: ${filename}`);
  return filePath;
}

/**
 * Generate Welcome Template Preview
 */
function generateWelcomePreview(): string {
  const { html } = renderWelcomeTemplate(MAIL_PREVIEW_CONFIG.WELCOME.data);
  return savePreview(MAIL_PREVIEW_CONFIG.WELCOME.filename, html);
}

/**
 * Generate New Follower Template Preview
 */
function generateFollowerPreview(): string {
  const { html } = renderNewFollowerTemplate(
    MAIL_PREVIEW_CONFIG.NEW_FOLLOWER.data,
  );
  return savePreview(MAIL_PREVIEW_CONFIG.NEW_FOLLOWER.filename, html);
}

/**
 * Generate Admin Daily Report Preview
 */
function generateAdminReportPreview(): string {
  const { html } = renderAdminDailyReportTemplate(
    MAIL_PREVIEW_CONFIG.ADMIN_DAILY_REPORT.data,
  );
  return savePreview(MAIL_PREVIEW_CONFIG.ADMIN_DAILY_REPORT.filename, html);
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);
  const type = args[0]?.toLowerCase() || MAIL_PREVIEW_TYPES.ALL;
  const generatedPaths: string[] = [];

  const allowedTypes = Object.values(MAIL_PREVIEW_TYPES).join('" or "');

  // Ensure preview directory exists
  try {
    mkdirSync(PREVIEW_DIR, { recursive: true });
  } catch (_) {
    logger.error(`❌ Failed to create preview directory: ${PREVIEW_DIR}`);
    process.exit(1);
  }

  logger.log('🎨 Generating email template previews...');

  switch (type) {
    case MAIL_PREVIEW_TYPES.WELCOME:
      generatedPaths.push(generateWelcomePreview());
      break;

    case MAIL_PREVIEW_TYPES.NEW_FOLLOWER:
      generatedPaths.push(generateFollowerPreview());
      break;

    case MAIL_PREVIEW_TYPES.ADMIN_DAILY_REPORT:
      generatedPaths.push(generateAdminReportPreview());
      break;

    case MAIL_PREVIEW_TYPES.ALL:
      generatedPaths.push(generateWelcomePreview());
      generatedPaths.push(generateFollowerPreview());
      generatedPaths.push(generateAdminReportPreview());
      break;

    default:
      logger.error(`❌ Unknown preview type: ${type}. Use "${allowedTypes}"`);
      process.exit(1);
  }

  if (generatedPaths.length > 0) {
    logger.log('');
    logger.log('='.repeat(60));
    logger.log('🎉 Preview files generated successfully!');
    logger.log('');
    logger.log('Open these files in your browser to preview:');
    generatedPaths.forEach((path) => logger.log(`  - ${path}`));
    logger.log('='.repeat(60));
  }
}

// Run the script
try {
  main();
} catch (error) {
  logger.error(
    `❌ Error generating previews: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
