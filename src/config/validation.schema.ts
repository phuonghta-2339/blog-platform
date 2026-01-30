import * as Joi from 'joi';
import { Defaults } from '@/common/constants/defaults';
import {
  MailProviderType,
  StorageProviderType,
} from '@/common/constants/providers';
import { LOCAL_STORAGE_CONFIG } from '@/modules/storage/constants/storage.constants';

export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),
  PORT: Joi.number()
    .port()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.number().default(Defaults.DEV.APP_PORT),
    })
    .description('Server port'),
  HOST: Joi.string()
    .hostname()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default(Defaults.DEV.APP_HOST),
    })
    .description('Server host'),
  APP_NAME: Joi.string()
    .min(1)
    .max(100)
    .default(Defaults.APP_NAME)
    .description('Application name'),
  API_PREFIX: Joi.string()
    .pattern(/^[a-z0-9/-]+$/)
    .default(Defaults.API_PREFIX)
    .description('API route prefix'),
  APP_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default(Defaults.DEV.APP_URL),
    })
    .description('Application URL (used for email links and CORS)'),

  // Database
  // Example: DATABASE_URL=postgresql://user:pass@localhost:5432/blog_test
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required()
    .description('PostgreSQL connection string'),

  // CORS
  // In test environment, CORS_ORIGIN defaults to localhost for test runners
  CORS_ORIGIN: Joi.string()
    .default(
      Joi.ref('$NODE_ENV', {
        adjust: (env) => {
          if (env === 'test')
            return 'http://localhost:3000,http://127.0.0.1:3000';
          if (env === 'production') return ''; // Must be explicitly set in production
          return 'http://localhost:3000';
        },
      }),
    )
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required().invalid('*', Defaults.DEV.APP_URL),
      otherwise: Joi.string(),
    })
    .description('Comma-separated list of allowed CORS origins'),

  CORS_METHODS: Joi.string()
    .default('GET,POST,PUT,PATCH,DELETE,OPTIONS')
    .description('Comma-separated list of allowed HTTP methods'),

  CORS_HEADERS: Joi.string()
    .default('Content-Type,Authorization')
    .description('Comma-separated list of allowed headers'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info')
    .description('Logging level'),

  // JWT Authentication
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Secret key for JWT token signing (minimum 32 characters)'),
  JWT_EXPIRES_IN: Joi.string()
    .default(Defaults.JWT_EXPIRES_IN)
    .description('JWT token expiration time (e.g., 7d, 24h, 60m)'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description(
      'Secret key for JWT refresh token signing (minimum 32 characters)',
    ),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default(Defaults.JWT_REFRESH_EXPIRES_IN)
    .description('JWT refresh token expiration time (e.g., 30d, 7d, 24h)'),

  // Redis (for BullMQ and Caching)
  REDIS_HOST: Joi.string()
    .hostname()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default(Defaults.DEV.REDIS_HOST),
    })
    .description('Redis server hostname'),
  REDIS_PORT: Joi.number()
    .port()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.number().default(Defaults.DEV.REDIS_PORT),
    })
    .description('Redis server port'),
  REDIS_PASSWORD: Joi.string()
    .allow('')
    .default('')
    .description('Redis password (optional)'),

  // Email Provider Selection
  MAIL_PROVIDER: Joi.string()
    .valid(...Object.values(MailProviderType))
    .default(MailProviderType.MAILGUN)
    .description(
      `Email provider to use (${Object.values(MailProviderType).join(' or ')})`,
    ),

  // Email (Mailgun - Primary)
  MAILGUN_API_KEY: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('MAIL_PROVIDER', {
        is: MailProviderType.MAILGUN,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(''),
      }),
      otherwise: Joi.string().allow(''),
    })
    .description('Mailgun API key for sending emails'),
  MAILGUN_DOMAIN: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('MAIL_PROVIDER', {
        is: MailProviderType.MAILGUN,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(''),
      }),
      otherwise: Joi.string().allow(''),
    })
    .description('Mailgun domain for sending emails'),
  MAILGUN_FROM_EMAIL: Joi.string()
    .email()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('MAIL_PROVIDER', {
        is: MailProviderType.MAILGUN,
        then: Joi.string().email().required(),
        otherwise: Joi.string().allow(''),
      }),
      otherwise: Joi.string().allow(''),
    })
    .description('Mailgun sender email address'),

  // Email (SendGrid - Optional)
  SENDGRID_API_KEY: Joi.string()
    .allow('')
    .description('SendGrid API key (optional fallback provider)'),
  SENDGRID_FROM_EMAIL: Joi.string()
    .email()
    .allow('')
    .description('SendGrid sender email address (optional)'),

  // Admin
  ADMIN_REPORT_RECIPIENTS: Joi.string()
    .pattern(/^[\w.-]+@[\w.-]+\.\w+(,[\w.-]+@[\w.-]+\.\w+)*$/)
    .allow('')
    .default('')
    .description('Comma-separated list of admin emails for reports'),

  // Storage
  STORAGE_PROVIDER: Joi.string()
    .valid(...Object.values(StorageProviderType))
    .default(StorageProviderType.MULTER)
    .description(
      `Storage provider to use (${Object.values(StorageProviderType).join(' or ')})`,
    ),
  LOCAL_UPLOAD_DIR: Joi.string()
    .default(LOCAL_STORAGE_CONFIG.UPLOAD_DIR)
    .description('Local storage upload directory'),
  LOCAL_URL_PREFIX: Joi.string()
    .default(LOCAL_STORAGE_CONFIG.URL_PREFIX)
    .description('URL prefix for locally stored files'),

  // Storage (Cloudinary - Optional)
  CLOUDINARY_CLOUD_NAME: Joi.string()
    .when('STORAGE_PROVIDER', {
      is: StorageProviderType.CLOUDINARY,
      then: Joi.string().required(),
      otherwise: Joi.string().allow(''),
    })
    .description(
      'Cloudinary cloud name (required if using cloudinary provider)',
    ),
  CLOUDINARY_API_KEY: Joi.string()
    .when('STORAGE_PROVIDER', {
      is: StorageProviderType.CLOUDINARY,
      then: Joi.string().required(),
      otherwise: Joi.string().allow(''),
    })
    .description('Cloudinary API key (required if using cloudinary provider)'),
  CLOUDINARY_API_SECRET: Joi.string()
    .when('STORAGE_PROVIDER', {
      is: StorageProviderType.CLOUDINARY,
      then: Joi.string().required(),
      otherwise: Joi.string().allow(''),
    })
    .description(
      'Cloudinary API secret (required if using cloudinary provider)',
    ),
});
