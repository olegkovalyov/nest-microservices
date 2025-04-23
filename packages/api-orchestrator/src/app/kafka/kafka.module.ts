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
              connectionTimeout: 10000,
              requestTimeout: 30000,
              retry: {
                maxRetryTime: 30000,
                initialRetryTime: 100,
                retries: 5
              }
            },
            consumer: {
              groupId: 'api-orchestrator-group-client',
              retry: {
                maxRetryTime: 30000,
                initialRetryTime: 100,
                retries: 5
              },
              maxWaitTimeInMs: 5000,
              sessionTimeout: 30000
            },
            producer: {
              allowAutoTopicCreation: true,
              transactionTimeout: 30000,
              maxOutgoingBatchSize: 100
            },
            run: {
              autoCommit: true,
              autoCommitInterval: 5000
            },
            send: {
              timeout: 30000,
              acks: 1
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