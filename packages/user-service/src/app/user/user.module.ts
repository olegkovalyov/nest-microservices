import {Module} from '@nestjs/common';
import {UserController} from './user.controller';
import {UserService} from './user.service';
import {Auth0MgmtTokenService} from '../auth/auth0-mgmt-token.service';
import {RedisModule} from '../redis.module';
import {ConfigModule} from '@nestjs/config';
import {Auth0UserService} from '../auth/auth0-user.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {HttpModule} from '@nestjs/axios';
import {User} from './user.entity';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    TypeOrmModule.forFeature([User]),
    HttpModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    Auth0MgmtTokenService,
    Auth0UserService
  ],
  exports: [
    UserService,
    Auth0MgmtTokenService,
    Auth0UserService
  ],
})
export class UserModule {
}
