import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),
  PORT: Joi.number().port().default(3000).description('Server port'),
  HOST: Joi.string().hostname().default('localhost').description('Server host'),
  APP_NAME: Joi.string()
    .min(1)
    .max(100)
    .default('Blog Platform')
    .description('Application name'),
  API_PREFIX: Joi.string()
    .pattern(/^[a-z0-9/-]+$/)
    .default('api/v1')
    .description('API route prefix'),

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
      then: Joi.string().required().invalid('*', 'http://localhost:3000'),
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
    .default('7d')
    .description('JWT token expiration time (e.g., 7d, 24h, 60m)'),
});
