/**
 * Provider Type Constants
 * Centralized provider types used for configuration and selection
 */

/**
 * Available mail provider types
 */
export enum MailProviderType {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
}

/**
 * Available storage provider types
 */
export enum StorageProviderType {
  MULTER = 'multer',
  CLOUDINARY = 'cloudinary',
}

/**
 * Default storage provider
 */
export const DEFAULT_STORAGE_PROVIDER = StorageProviderType.MULTER;
