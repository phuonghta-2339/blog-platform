import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('localhost'),
  APP_NAME: Joi.string().default('Blog Platform'),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().uri().required(),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  CORS_METHODS: Joi.string().default('GET,POST,PUT,PATCH,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: Joi.string().default('Content-Type,Authorization'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
});
