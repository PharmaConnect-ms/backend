import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;

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
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
