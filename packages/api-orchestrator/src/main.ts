/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import { GrpcExceptionFilter } from './common/filters/grpc-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Global error handlers
process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught Exception: ${error.message}`, error.stack);
  // In production, notification delivery can be added here
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // In production, notification delivery can be added here
});

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    app.use(cookieParser());

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new GrpcExceptionFilter());
    app.enableCors();
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    const globalPrefix = 'api/v1';
    app.setGlobalPrefix(globalPrefix);

    const config = new DocumentBuilder()
      .setTitle('API Orchestrator')
      .setDescription('The main API gateway for the EdTech platform, orchestrating calls to microservices.')
      .setVersion('1.0')
      .addTag('Users', 'User management endpoints') // Add tags for controllers
      .addTag('Auth', 'Authentication endpoints')   // Add more tags as needed
      .addBearerAuth( // Add JWT Bearer token authentication
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth', // Name of the security scheme (can be anything)
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    // Serve Swagger UI at /api/docs endpoint
    SwaggerModule.setup('api/docs', app, document, {
       swaggerOptions: {
         persistAuthorization: true, // Persist authorization in Swagger UI
       },
       customSiteTitle: 'API Orchestrator Docs', // Optional: Custom title
    });

    const port = process.env.API_ORCHESTRATOR_PORT || 3000;
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
    Logger.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`); // Log Swagger path
  } catch (error: unknown) {
    if (error instanceof Error) {
      Logger.error(`❌ Error starting server: ${error.message}`, error.stack);
    } else {
      Logger.error(`❌ Error starting server: ${JSON.stringify(error)}`);
    }
    process.exit(1);
  }
}

// Run with error handling
bootstrap().catch(err => {
  Logger.error(`❌ Fatal error during bootstrap: ${err.message}`, err.stack);
  process.exit(1);
});
