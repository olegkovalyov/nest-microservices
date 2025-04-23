import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeycloakService } from './keycloak.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [KeycloakService, AuthGuard],
  exports: [KeycloakService, AuthGuard],
})
export class AuthModule {} 