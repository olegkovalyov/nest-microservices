import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Включаем валидацию
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Настраиваем Swagger для API документации
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User management service for educational platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Получаем порт из переменных окружения
  const port = process.env.USERS_SERVICE_PORT || 3001;
  
  await app.listen(port);
  console.log(`User service is running on port ${port}`);
}

bootstrap(); 