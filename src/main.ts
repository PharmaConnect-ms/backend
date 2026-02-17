import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { SecretsValidator, INTEGRATION_SECRETS } from './common/security';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';

  // POLICY: B. Secrets Management - Validate all required secrets before startup
  try {
    SecretsValidator.validateRequired(
      [
        ...INTEGRATION_SECRETS.JWT.required,
        ...INTEGRATION_SECRETS.DATABASE.required,
        ...INTEGRATION_SECRETS.ZOOM.required,
        ...INTEGRATION_SECRETS.OPENAI.required,
        ...INTEGRATION_SECRETS.GOOGLE.required,
      ],
      [
        ...INTEGRATION_SECRETS.ZOOM.optional,
        ...INTEGRATION_SECRETS.OPENAI.optional,
      ],
    );
    logger.log('✓ All required secrets validated');
  } catch (error) {
    logger.error('✗ Secret validation failed - application cannot start');
    throw error;
  }

  const port = configService.get<number>('PORT') || 5000;

  // POLICY: A. Secure Configuration - CORS configuration from environment
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  if (!corsOrigin) {
    logger.error('CORS_ORIGIN not configured - defaulting to localhost:3000 (development only)');
  }

  app.enableCors({
    origin: corsOrigin || (isDevelopment ? 'http://localhost:3000' : false),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // POLICY: A. Secure Configuration - Don't expose implementation details
    exposedHeaders: [],
  });

  logger.log(`✓ CORS enabled for origin: ${corsOrigin || 'localhost:3000 (dev)'}`);

  // Enable Swagger
  const config = new DocumentBuilder()
    .setTitle('PharmaConnect API')
    .setDescription('API documentation for PharmaConnect - Third-Party Integration Security Enhanced')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  logger.log(`
╔════════════════════════════════════════════════════════════╗
║                PharmaConnect Backend Started                ║
╚════════════════════════════════════════════════════════════╝
🚀 Server running on http://localhost:${port}
📚 API docs available at http://localhost:${port}/api
🔒 Security Policy: Third-Party Integration Security Policy (ACTIVE)
🌐 CORS Origin: ${corsOrigin || 'localhost:3000 (dev)'}
🔐 Secrets: Validated ✓
═════════════════════════════════════════════════════════════
  `);
}

bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
