import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    // Загружаем и валидируем переменные окружения
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Регистрируем модуль пользователей
    UserModule,
  ],
})
export class AppModule {} 