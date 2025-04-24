import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private isConnected = false;
  private connectionAttempted = false;

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      // Подписываемся на необходимые топики
      this.kafkaClient.subscribeToResponseOf('user.created');
      this.kafkaClient.subscribeToResponseOf('user.updated');
      this.kafkaClient.subscribeToResponseOf('user.deleted');
      
      this.connectionAttempted = true;
      
      // Устанавливаем таймаут как положительное число
      const connectionTimeout = 5000; // 5 секунд
      
      // Вместо Promise.race используем setTimeout
      const connectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.logger.warn('Kafka connection timeout after 5s, continuing without Kafka');
        }
      }, connectionTimeout);
      
      try {
        await this.kafkaClient.connect();
        this.isConnected = true;
        this.logger.log('Kafka client connected successfully');
      } catch (error) {
        this.logger.warn(`Kafka connection error: ${error.message}`);
      } finally {
        clearTimeout(connectTimeout);
      }
    } catch (error) {
      this.logger.warn(`Failed to initialize Kafka client: ${error.message}`);
      this.logger.warn('Application will continue to work, but Kafka functionality may be limited');
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      try {
        await this.kafkaClient.close();
        this.logger.log('Kafka client disconnected');
      } catch (error) {
        this.logger.error(`Error during Kafka client disconnection: ${error.message}`);
      }
    }
  }

  async sendMessage(topic: string, message: any) {
    if (!this.connectionAttempted) {
      await this.onModuleInit();
    }
    
    if (!this.isConnected) {
      this.logger.warn(`Trying to send message to topic ${topic} but Kafka is not connected`);
      return null;
    }
    
    try {
      this.logger.log(`Sending message to topic: ${topic}`);
      const observable = this.kafkaClient.send(topic, message);
      return await firstValueFrom(observable);
    } catch (error) {
      this.logger.error(`Error sending message to topic ${topic}: ${error.message}`);
      return null;
    }
  }

  async emitEvent(topic: string, data: any) {
    if (!this.connectionAttempted) {
      await this.onModuleInit();
    }
    
    if (!this.isConnected) {
      this.logger.warn(`Trying to emit event to topic ${topic} but Kafka is not connected`);
      return;
    }
    
    try {
      this.logger.log(`Emitting event to topic: ${topic}`);
      this.kafkaClient.emit(topic, data);
      this.logger.log(`Event emitted to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Error emitting event to topic ${topic}: ${error.message}`);
    }
  }
} 