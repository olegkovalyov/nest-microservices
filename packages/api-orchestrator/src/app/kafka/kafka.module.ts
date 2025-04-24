import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'api-orchestrator-client',
              brokers: [configService.get('KAFKA_BROKERS') || 'localhost:9092'],
              connectionTimeout: 3000, // Уменьшено с 10000 до 3000
              retry: {
                initialRetryTime: 100, // Уменьшено с 300 до 100
                retries: 3,           // Уменьшено с 5 до 3
                maxRetryTime: 3000    // Максимальное время между попытками
              }
            },
            consumer: {
              groupId: configService.get('KAFKA_GROUP_ID') || 'api-orchestrator-group-client',
              sessionTimeout: 6000,   // Уменьшено с 30000 до 6000
              heartbeatInterval: 2000, // Уменьшено с 5000 до 2000
              maxWaitTimeInMs: 1000,  // Максимальное время ожидания для получения сообщений
              allowAutoTopicCreation: true, // Разрешить автоматическое создание топиков
              maxBytes: 1048576,      // 1MB - ограничить объем данных при получении
              rebalanceTimeout: 5000  // Сократить время ребалансировки
            },
            producer: {
              allowAutoTopicCreation: true,
              transactionTimeout: 5000, // Добавлен таймаут транзакций
              idempotent: false        // Отключить идемпотентность для большей скорости
            },
            run: {
              autoCommit: true,         // Автоматический коммит
              autoCommitInterval: 100,  // Интервал между коммитами
              autoCommitThreshold: 100  // Количество сообщений между коммитами
            }
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
