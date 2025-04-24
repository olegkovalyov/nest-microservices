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
              connectionTimeout: 3000, // Reduced from 10000 to 3000
              retry: {
                initialRetryTime: 100, // Reduced from 300 to 100
                retries: 3,           // Reduced from 5 to 3
                maxRetryTime: 3000    // Maximum time between retries
              }
            },
            consumer: {
              groupId: configService.get('KAFKA_GROUP_ID') || 'api-orchestrator-group-client',
              sessionTimeout: 6000,   // Reduced from 30000 to 6000
              heartbeatInterval: 2000, // Reduced from 5000 to 2000
              maxWaitTimeInMs: 1000,  // Maximum wait time for receiving messages
              allowAutoTopicCreation: true, // Allow automatic topic creation
              maxBytes: 1048576,      // 1MB - limit data volume when receiving
              rebalanceTimeout: 5000  // Reduce rebalancing time
            },
            producer: {
              allowAutoTopicCreation: true,
              transactionTimeout: 5000, // Added transaction timeout
              idempotent: false        // Disable idempotency for better speed
            },
            run: {
              autoCommit: true,         // Automatic commit
              autoCommitInterval: 100,  // Interval between commits
              autoCommitThreshold: 100  // Number of messages between commits
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
