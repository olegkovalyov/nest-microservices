import { ClientOptions, Transport } from '@nestjs/microservices';
import { resolve } from 'path';

export const userGrpcClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: process.env.GRPC_URL || 'localhost:5001',
    package: 'user',
    protoPath: resolve(process.cwd(), 'proto-contracts/user-service.proto'),
  },
};
