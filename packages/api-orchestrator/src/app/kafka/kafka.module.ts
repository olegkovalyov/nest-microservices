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
              clientId: 'api-orchestrator',
              brokers: [configService.get('KAFKA_BROKERS') || 'localhost:9092'],
            },
            consumer: {
              groupId: configService.get('KAFKA_GROUP_ID') || 'api-orchestrator-group',
            },
            producer: {
              allowAutoTopicCreation: true,
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