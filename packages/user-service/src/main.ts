import {NestFactory} from '@nestjs/core';
import {MicroserviceOptions, Transport} from '@nestjs/microservices';
import {join} from 'path';
import {AppModule} from './app/app.module';

process.on('warning', (warning) => {
  if (warning.name === 'TimeoutNegativeWarning') {
    console.log('warning');
    return;
  }
});

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:5001', // порт для gRPC
      package: 'user',
      protoPath: join(process.cwd(), 'libs/common/proto/user-service.proto'),
    },
  });
  await app.listen();
  console.log('User gRPC microservice is running');
}

bootstrap();
