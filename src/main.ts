import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupSwagger } from './config/swagger.config';
import { AppConfigService } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Get AppConfigService
    const configService = app.get(AppConfigService);
    const appConfig = configService.app;

    // Global prefix
    app.setGlobalPrefix(appConfig.apiPrefix);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Remove properties not in DTO
        forbidNonWhitelisted: true, // Throw error if extra properties
        transform: true, // Auto-transform to DTO types
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global exception filters
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new PrismaExceptionFilter(),
    );

    // Global interceptors
    app.useGlobalInterceptors(new TransformInterceptor());

    // Enable CORS
    app.enableCors({
      origin: appConfig.corsOrigin,
      credentials: true,
      methods: appConfig.corsMethods,
      allowedHeaders: appConfig.corsAllowedHeaders,
    });

    // Setup Swagger/OpenAPI Documentation
    setupSwagger(app);

    // Graceful shutdown
    app.enableShutdownHooks();

    // Start server
    await app.listen(appConfig.port, appConfig.host);

    // Display application info
    logger.log(`🚀 Application is running on: ${configService.getApiUrl()}`);
    logger.log(`📚 Swagger documentation: ${configService.getSwaggerUrl()}`);
    logger.log(`🌍 Environment: ${appConfig.env}`);
    logger.log(`📦 App Name: ${appConfig.name}`);
  } catch (error) {
    logger.error('❌ Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
