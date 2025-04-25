import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';
import { UserModule } from './users/user.module';
import {AuthModule} from './auth/auth.module';
import {AuthController} from './auth/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KafkaModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
