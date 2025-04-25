/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app/app.module';
import {ValidationPipe} from '@nestjs/common';
import * as express from 'express';
import {patchKafkaJsTimeouts} from './app/kafka/kafka.patch';
import cookieParser from 'cookie-parser';

// Global error handlers
process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught Exception: ${error.message}`, error.stack);
  // In production, notification delivery can be added here
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // In production, notification delivery can be added here
});

// Apply patch to fix the negative timeout issue in KafkaJS
patchKafkaJsTimeouts();

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
    app.enableCors();
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    const globalPrefix = 'api/v1';
    app.setGlobalPrefix(globalPrefix);
    const port = process.env.API_ORCHESTRATOR_PORT || 3000;
    await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  } catch (error) {
    Logger.error(`❌ Error starting server: ${error.message}`, error.stack);
    process.exit(1);
  }
}

// Run with error handling
bootstrap().catch(err => {
  Logger.error(`❌ Fatal error during bootstrap: ${err.message}`, err.stack);
  process.exit(1);
});
