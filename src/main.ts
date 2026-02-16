import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as https from 'https';
import { LogSanitizationService } from './common/log-sanitization.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logSanitizationService = app.get(LogSanitizationService);

  const port = configService.get<number>('PORT') || 5000;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const useHttps = configService.get<boolean>('USE_HTTPS') || nodeEnv !== 'development';
  const enableSwagger = configService.get<boolean>('ENABLE_SWAGGER') === true;

  // ==================== SECURITY HEADERS ====================
  // Enforce security headers per HIPAA/OWASP standards
  app.use((req, res, next) => {
    // HTTPS enforcement - redirect HTTP to HTTPS in production
    if (useHttps && req.protocol !== 'https' && nodeEnv !== 'development') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    );

    // HTTP Strict Transport Security (HSTS)
    // Enforces HTTPS for 1 year
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Prevent unauthorized access via Permissions-Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
  });

  // ==================== CORS CONFIGURATION ====================
  // Restrict CORS to trusted origins only
  const allowedOrigins = (configService.get<string>('CORS_ORIGINS') || 'http://localhost:3000').split(',');

  app.enableCors({
    origin: allowedOrigins.map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600, // Preflight cache duration
  });

  // ==================== SWAGGER DOCUMENTATION ====================
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('PharmaConnect API')
      .setDescription('API documentation for PharmaConnect - Data Protection & Encryption Compliant')
      .setVersion('1.0.0')
      .addServer(useHttps ? `https://localhost:${port}` : `http://localhost:${port}`, 'Development Server')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // ==================== GLOBAL ERROR HANDLING ====================
  // Sanitize all error responses to prevent Information Disclosure
  app.use((err: any, req: any, res: any, next: any) => {
    const isDevelopment = nodeEnv === 'development';

    // Log safely using sanitization service
    logSanitizationService.logErrorSafely(`Request error: ${req.method} ${req.path}`, err, 'GlobalErrorHandler');

    // Create safe response
    const safeError = logSanitizationService.createSafeErrorResponse(err, isDevelopment);

    res.status(safeError.statusCode).json(safeError);
  });

  // ==================== START SERVER ====================
  if (useHttps && nodeEnv !== 'development') {
    // Use HTTPS with TLS 1.2+
    const keyPath = configService.get<string>('SSL_KEY_PATH');
    const certPath = configService.get<string>('SSL_CERT_PATH');

    if (!keyPath || !certPath) {
      console.warn('SSL_KEY_PATH or SSL_CERT_PATH not configured. Running on HTTP. This is NOT recommended for production.');
    } else {
      try {
        const privateKey = fs.readFileSync(keyPath, 'utf8');
        const certificate = fs.readFileSync(certPath, 'utf8');
        const credentials = { key: privateKey, cert: certificate };

        // Create HTTPS server with TLS 1.2 minimum
        const httpsServer = https.createServer(
          {
            ...credentials,
            minVersion: 'TLSv1.2' as any, // Enforce TLS 1.2 or higher
            ciphers: [
              'ECDHE-ECDSA-AES128-GCM-SHA256',
              'ECDHE-RSA-AES128-GCM-SHA256',
              'ECDHE-ECDSA-AES256-GCM-SHA384',
              'ECDHE-RSA-AES256-GCM-SHA384',
            ].join(':'),
          },
          app.getHttpAdapter().getInstance(),
        );

        await app.init();
        httpsServer.listen(port, () => {
          logSanitizationService.logSafely(
            `PharmaConnect Server running on https://localhost:${port}`,
            'Bootstrap',
            { nodeEnv, tlsVersion: '1.2+' },
          );
        });
      } catch (error) {
        console.error('Failed to load SSL certificates:', error.message);
        process.exit(1);
      }
    }
  } else {
    // Development: HTTP only
    await app.listen(port);
    logSanitizationService.logSafely(
      `PharmaConnect Server running on http://localhost:${port} (Development mode)`,
      'Bootstrap',
      { nodeEnv, warning: 'HTTPS not enabled in development' },
    );
  }
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
