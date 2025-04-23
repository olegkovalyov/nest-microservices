import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { KafkaModule } from '../kafka/kafka.module';
import { AuthModule } from '../auth/keycloak.module';

@Module({
  imports: [KafkaModule, AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {} 