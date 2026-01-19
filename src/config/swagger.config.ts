import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Setup Swagger/OpenAPI documentation for the application
 * Supports multiple API versions
 * @param app - The NestJS application instance
 */
export function setupSwagger(app: INestApplication): void {
  // Configuration for Version 1
  const configV1 = new DocumentBuilder()
    .setTitle('Blog Platform API v1')
    .setDescription(
      'A production-ready RESTful API for a blog platform (Medium clone) built with NestJS, Prisma, and PostgreSQL',
    )
    .setVersion('1.0')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('auth', 'Authentication & Authorization')
    .addTag('users', 'User management')
    .addTag('articles', 'Article CRUD operations')
    .addTag('comments', 'Comment operations')
    .addTag('tags', 'Tag management')
    .addTag('favorites', 'Favorite articles')
    .addTag('follows', 'Follow users')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Local Development')
    .build();

  // Create document for v1 - only include v1 controllers
  const documentV1 = SwaggerModule.createDocument(app, configV1, {
    include: [], // Will be populated with v1 modules
    deepScanRoutes: true,
  });

  // Setup Swagger UI for v1
  SwaggerModule.setup('api/docs/v1', app, documentV1, {
    customSiteTitle: 'Blog Platform API v1 Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.min.css',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Configuration for all versions (overview)
  const configAll = new DocumentBuilder()
    .setTitle('Blog Platform API')
    .setDescription(
      'Complete API documentation for all versions. A production-ready RESTful API for a blog platform (Medium clone) built with NestJS, Prisma, and PostgreSQL',
    )
    .setVersion('1.0')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Local Development')
    .build();

  // Create document for all versions
  const documentAll = SwaggerModule.createDocument(app, configAll, {
    deepScanRoutes: true,
  });

  // Setup Swagger UI for all versions
  SwaggerModule.setup('api/docs', app, documentAll, {
    customSiteTitle: 'Blog Platform API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.min.css',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
