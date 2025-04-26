import {NestFactory} from '@nestjs/core';
import {MicroserviceOptions, Transport} from '@nestjs/microservices';
import {resolve} from 'path';
import {UserModule} from './app/user/user.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserModule, {
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:5001', // порт для gRPC
      package: 'user',
      protoPath: resolve(process.cwd(), 'proto-contracts/user-service.proto'),
    },
  });
  await app.listen();
  console.log('User gRPC microservice is running');
}

bootstrap();
