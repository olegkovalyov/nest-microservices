import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private isConnected = false;
  private connectionAttempted = false;
  private kafkaEnabled = true;
  private kafkaFastDev = false;
  private connectionRetries = 0;
  private maxRetries = 5;
  private connectPromise: Promise<void> | null = null;
  private connectionTimeout: number;

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private configService: ConfigService
  ) {
    // Проверяем настройки Kafka
    const kafkaEnabled = this.configService.get('KAFKA_ENABLED');
    this.kafkaEnabled = kafkaEnabled !== 'false';
    
    // Режим быстрой разработки - для ускорения запуска в dev-среде
    const fastDev = this.configService.get('KAFKA_FAST_DEV');
    this.kafkaFastDev = fastDev === 'true';
    
    // Таймаут подключения из конфигурации или по умолчанию
    this.connectionTimeout = parseInt(this.configService.get('KAFKA_CONNECTION_TIMEOUT') || '10000', 10);
  }

  async onModuleInit() {
    // If Kafka is disabled, skip connection
    if (!this.kafkaEnabled) {
      this.logger.log('Kafka service is disabled by configuration. Skipping connection.');
      return;
    }

    try {
      // Выводим конфигурацию Kafka для отладки
      this.logger.log('Kafka configuration:', {
        brokers: this.configService.get('KAFKA_BROKERS'),
        groupId: this.configService.get('KAFKA_GROUP_ID'),
        enabled: this.configService.get('KAFKA_ENABLED'),
        fastDev: this.kafkaFastDev,
        connectionTimeout: this.connectionTimeout
      });
      
      this.logger.log('Initializing Kafka service...');
      
      // Подписываемся на необходимые топики
      this.kafkaClient.subscribeToResponseOf('user.created');
      this.kafkaClient.subscribeToResponseOf('user.updated');
      this.kafkaClient.subscribeToResponseOf('user.deleted');
      
      this.connectionAttempted = true;
      
      // В режиме быстрой разработки симулируем подключение
      if (this.kafkaFastDev) {
        this.logger.log('Running in FAST DEV mode. Kafka connection will be established in background.');
        
        // Запускаем подключение в фоне, не дожидаясь результата
        this.connectPromise = this.connectWithTimeout();
        this.connectPromise.catch(error => {
          this.logger.error(`Background Kafka connection failed: ${error.message}`);
        });
        
        return;
      }
      
      // В обычном режиме - асинхронно подключаемся
      this.connectPromise = this.connectWithRetry();
      
      // Запускаем подключение в фоне, не ожидая завершения
      this.connectPromise.catch(error => {
        this.logger.error(`Background Kafka connection failed: ${error.message}`);
      });
      
      // Сразу возвращаем управление, не дожидаясь подключения
      this.logger.log('Application will continue loading while Kafka connects in background...');
    } catch (error) {
      this.logger.error(`Failed to initialize Kafka client: ${error.message}`);
      this.logger.warn('Application will continue to work, but Kafka functionality will be limited');
    }
  }

  // Подключение с таймаутом для режима быстрой разработки
  private async connectWithTimeout(): Promise<void> {
    try {
      // Создаем промис для подключения с таймаутом
      const connectionPromise = this.kafkaClient.connect();
      
      // Создаем промис для таймаута
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Kafka connection timed out after ${this.connectionTimeout}ms`));
        }, this.connectionTimeout);
      });
      
      // Используем Promise.race для ограничения времени подключения
      await Promise.race([connectionPromise, timeoutPromise]);
      
      this.isConnected = true;
      this.logger.log('Kafka client connected successfully');
    } catch (error) {
      this.logger.warn(`Fast dev Kafka connection failed: ${error.message}`);
      this.logger.warn('Application will continue without waiting for Kafka');
      
      // Продолжаем подключение в фоне
      this.kafkaClient.connect()
        .then(() => {
          this.isConnected = true;
          this.logger.log('Kafka client connected successfully in background');
        })
        .catch(error => {
          this.logger.error(`Background Kafka connection ultimately failed: ${error.message}`);
        });
    }
  }

  private async connectWithRetry(): Promise<void> {
    const retryDelayMs = 3000; // 3 seconds between retries
    
    while (this.connectionRetries < this.maxRetries && !this.isConnected) {
      try {
        this.logger.log(`Attempting to connect to Kafka (attempt ${this.connectionRetries + 1}/${this.maxRetries})...`);
        await this.kafkaClient.connect();
        this.isConnected = true;
        this.logger.log('Kafka client connected successfully');
        return;
      } catch (error) {
        this.connectionRetries++;
        if (this.connectionRetries < this.maxRetries) {
          this.logger.warn(`Kafka connection failed (attempt ${this.connectionRetries}/${this.maxRetries}): ${error.message}`);
          this.logger.log(`Retrying in ${retryDelayMs/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        } else {
          this.logger.error(`Failed to connect to Kafka after ${this.maxRetries} attempts: ${error.message}`);
        }
      }
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

  // Этот метод можно использовать для ожидания подключения при необходимости
  async ensureConnected(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }
    
    if (this.connectPromise) {
      try {
        await this.connectPromise;
        return this.isConnected;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  }

  async sendMessage(topic: string, message: any) {
    if (!this.kafkaEnabled) {
      this.logger.debug(`Kafka is disabled - skipped sending message to topic ${topic}`);
      return null;
    }
    
    // Проверяем подключение перед отправкой
    if (!this.isConnected) {
      // Пытаемся дождаться завершения фонового подключения
      const connected = await this.ensureConnected();
      if (!connected) {
        this.logger.warn(`Cannot send message to topic ${topic} - Kafka is not connected`);
        return null;
      }
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
    if (!this.kafkaEnabled) {
      this.logger.debug(`Kafka is disabled - skipped emitting event to topic ${topic}`);
      return;
    }
    
    // Проверяем подключение перед отправкой
    if (!this.isConnected) {
      // Пытаемся дождаться завершения фонового подключения
      const connected = await this.ensureConnected();
      if (!connected) {
        this.logger.warn(`Cannot emit event to topic ${topic} - Kafka is not connected`);
        return;
      }
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
