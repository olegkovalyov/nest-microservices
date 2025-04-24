import { Module } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [KeycloakService],
  exports: [KeycloakService],
})
export class KeycloakModule {} 