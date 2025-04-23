import { Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to topics
    this.kafkaClient.subscribeToResponseOf('user.created');
    this.kafkaClient.subscribeToResponseOf('user.updated');
    this.kafkaClient.subscribeToResponseOf('user.deleted');
    
    await this.kafkaClient.connect();
    this.logger.log('Kafka client connected successfully');
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
    this.logger.log('Kafka client disconnected');
  }

  async sendMessage(topic: string, message: any) {
    try {
      this.logger.log(`Sending message to topic: ${topic}`);
      return await this.kafkaClient.send(topic, message).toPromise();
    } catch (error) {
      this.logger.error(`Error sending message to topic ${topic}:`, error);
      throw error;
    }
  }

  async emitEvent(topic: string, data: any) {
    try {
      this.logger.log(`Emitting event to topic: ${topic}`);
      this.kafkaClient.emit(topic, data);
    } catch (error) {
      this.logger.error(`Error emitting event to topic ${topic}:`, error);
      throw error;
    }
  }
} 