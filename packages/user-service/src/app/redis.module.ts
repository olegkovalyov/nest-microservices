import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: `redis://${config.get('REDIS_HOST', 'localhost')}:${config.get('REDIS_PORT', 6379)}`,
        options: {
          password: config.get('REDIS_PASSWORD', 'redispass123'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [IoRedisModule],
})
export class RedisModule {}
