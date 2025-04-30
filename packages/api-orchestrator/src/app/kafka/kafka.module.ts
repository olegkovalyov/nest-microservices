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
        useFactory: async (configService: ConfigService) => {
          const brokersString = configService.get<string>('KAFKA_BROKERS', 'localhost:9092');
          const brokers = brokersString.split(',').map(broker => broker.trim());
          console.log(`KAFKA_BROKERS string from env: "${brokersString}"`);
          console.log('Parsed KAFKA_BROKERS for KafkaModule:', brokers);
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'api-orchestrator-client',
                brokers: brokers,
                connectionTimeout: 3000,
                requestTimeout: 3000,
              },
              consumer: {
                groupId: configService.get<string>('KAFKA_GROUP_ID', 'api-orchestrator-group-client'),
                maxBytes: 1048576,
              },
              producer: {},
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService, ClientsModule],
})
export class KafkaModule {}
