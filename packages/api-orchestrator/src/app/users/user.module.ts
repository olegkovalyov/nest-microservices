import {Module} from '@nestjs/common';
import {UserController} from './controllers/user.controller';
import {UserService} from './services/user.service';
import {UserGrpcClientService} from './services/user.grpc-client';
import {KafkaModule} from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  controllers: [UserController],
  providers: [UserService, UserGrpcClientService],
  exports: [UserService],
})
export class UserModule {
}
