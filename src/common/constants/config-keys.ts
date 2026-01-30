/**
 * Config Keys
 * Centralized keys for accessing configuration via ConfigService
 */
export const ConfigKeys = {
  APP: {
    URL: 'app.url',
    JWT_SECRET: 'app.jwtSecret',
    JWT_EXPIRES_IN: 'app.jwtExpiresIn',
    JWT_REFRESH_SECRET: 'app.jwtRefreshSecret',
    JWT_REFRESH_EXPIRES_IN: 'app.jwtRefreshExpiresIn',
    PORT: 'app.port',
    ENV: 'app.env',
  },
  REDIS: {
    HOST: 'redis.host',
    PORT: 'redis.port',
    PASSWORD: 'redis.password',
  },
  MAIL: {
    PROVIDER: 'mail.provider',
    MAILGUN_API_KEY: 'mail.mailgun.apiKey',
    MAILGUN_DOMAIN: 'mail.mailgun.domain',
    MAILGUN_FROM_EMAIL: 'mail.mailgun.fromEmail',
    SENDGRID_API_KEY: 'mail.sendgrid.apiKey',
    SENDGRID_FROM_EMAIL: 'mail.sendgrid.fromEmail',
  },
  STORAGE: {
    PROVIDER: 'storage.provider',
    LOCAL_UPLOAD_DIR: 'storage.local.uploadDir',
    LOCAL_URL_PREFIX: 'storage.local.urlPrefix',
  },
  CLOUDINARY: {
    CLOUD_NAME: 'cloudinary.cloudName',
    API_KEY: 'cloudinary.apiKey',
    API_SECRET: 'cloudinary.apiSecret',
  },
} as const;

export type ConfigKeyType = typeof ConfigKeys;
