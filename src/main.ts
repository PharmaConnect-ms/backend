import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { RequestContextService } from '@/common/logging/request-context.service';
import { AppLoggerService } from '@/common/logging/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const requestContext = app.get(RequestContextService);
  const logger = app.get(AppLoggerService);
  const port = configService.get<number>('PORT') || 5000;

  app.use((req, res, next) => {
    const incomingRequestId = req.header('x-request-id');
    const requestId = incomingRequestId || randomUUID();
    res.setHeader('x-request-id', requestId);

    requestContext.runWithContext({
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
    }, next);
  });

  app.enableCors({
    origin: 'http://localhost:3000', // allow frontend origin
    credentials: true, // allow cookies, authorization headers, etc.
  });


  // Enable Swagger
  const config = new DocumentBuilder()
    .setTitle('PharmaConnect API')
    .setDescription('API documentation for PharmaConnect')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  logger.info('Server started', { port }, { context: 'bootstrap', event: 'app.started' });
}
bootstrap();
