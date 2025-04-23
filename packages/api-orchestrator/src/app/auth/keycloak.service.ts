import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeycloakConnect = require('keycloak-connect');

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private keycloak: KeycloakConnect.Keycloak;

  constructor(private configService: ConfigService) {
    this.initializeKeycloak();
  }

  private initializeKeycloak() {
    const keycloakConfig = {
      realm: this.configService.get('KEYCLOAK_REALM'),
      'auth-server-url': this.configService.get('KEYCLOAK_URL'),
      'ssl-required': 'external',
      resource: this.configService.get('KEYCLOAK_CLIENT_ID'),
      'verify-token-audience': true,
      credentials: {
        secret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
      },
      'confidential-port': 0,
      'policy-enforcer': {},
    };

    this.keycloak = new KeycloakConnect({}, keycloakConfig);
    this.logger.log('Keycloak initialized successfully');
  }

  getKeycloakInstance(): KeycloakConnect.Keycloak {
    return this.keycloak;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const result = await this.keycloak.grantManager.validateAccessToken(token);
      return !!result; // Convert to boolean
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      return false;
    }
  }

  async getUserInfo(token: string): Promise<any> {
    try {
      const userInfo = await this.keycloak.grantManager.userInfo(token);
      return userInfo;
    } catch (error) {
      this.logger.error('Failed to get user info:', error);
      throw error;
    }
  }
}
