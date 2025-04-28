import { ClientOptions, Transport } from '@nestjs/microservices';
import { join, resolve } from 'path';

export const userGrpcClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: process.env.GRPC_URL || 'localhost:5001',
    package: 'user',
    protoPath: join(process.cwd(), 'libs/common/proto/user-service.proto'),
  },
};
