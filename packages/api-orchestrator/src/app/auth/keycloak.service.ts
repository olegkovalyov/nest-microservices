import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeycloakConnect = require('keycloak-connect');
import axios from 'axios';
import * as qs from 'qs';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private keycloak: KeycloakConnect.Keycloak;
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL') || 'http://localhost:8080';
    this.realm = this.configService.get<string>('KEYCLOAK_REALM') || 'education';
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID') || 'postman-client';
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET') || '';
    this.initializeKeycloak();
  }

  private initializeKeycloak() {
    const keycloakConfig = {
      realm: this.realm,
      'auth-server-url': this.keycloakUrl,
      'ssl-required': 'external',
      resource: this.clientId,
      'verify-token-audience': true,
      credentials: {
        secret: this.clientSecret,
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
      if (!token) {
        return false;
      }
      const result = await this.keycloak.grantManager.validateAccessToken(token);
      return !!result; // Convert to boolean
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      return false;
    }
  }

  async getUserInfo(token: string): Promise<any> {
    try {
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      const userInfo = await this.keycloak.grantManager.userInfo(token);
      return userInfo;
    } catch (error) {
      this.logger.error('Failed to get user info:', error);
      throw error;
    }
  }

  async login(username: string, password: string): Promise<TokenResponse> {
    try {
      this.logger.log(`Attempting login for user: ${username}`);
      this.logger.log(`Using Keycloak URL: ${this.keycloakUrl}`);
      this.logger.log(`Using Realm: ${this.realm}`);
      this.logger.log(`Using Client ID: ${this.clientId}`);

      const data: Record<string, string> = {
        grant_type: 'password',
        client_id: this.clientId,
        username,
        password,
      };

      // If client_secret is provided, add it to the request
      if (this.clientSecret) {
        data['client_secret'] = this.clientSecret;
      }

      this.logger.log(`Sending request to Keycloak token endpoint with data: ${JSON.stringify(data, null, 2)}`);

      this.logger.log(`${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token\``);
      const response = await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        qs.stringify(data),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Login successful');
      return response.data;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      if (error.response) {
        this.logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`Status: ${error.response.status}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      this.logger.log(`Attempting to refresh token with client ID: ${this.clientId}`);
      
      const data: Record<string, string> = {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        refresh_token: refreshToken,
      };

      // Добавляем client_secret только если он установлен
      if (this.clientSecret) {
        data.client_secret = this.clientSecret;
      }

      this.logger.log(`Sending refresh request to Keycloak with data: ${JSON.stringify(data, null, 2)}`);
      this.logger.log(`Token endpoint: ${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`);

      const response = await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        qs.stringify(data),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.logger.log('Token refresh successful');
      return response.data;
    } catch (error) {
      this.logger.error('Token refresh failed:', error.response?.data || error.message);
      if (error.response) {
        this.logger.error(`Error status: ${error.response.status}`);
        this.logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      if (!refreshToken) {
        return;
      }
      
      this.logger.log(`Attempting to logout with client ID: ${this.clientId}`);
      
      const data: Record<string, string> = {
        client_id: this.clientId,
        refresh_token: refreshToken,
      };

      // Добавляем client_secret только если он установлен
      if (this.clientSecret) {
        data.client_secret = this.clientSecret;
      }

      this.logger.log(`Sending logout request to Keycloak with data: ${JSON.stringify(data, null, 2)}`);
      this.logger.log(`Logout endpoint: ${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`);
      
      await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`,
        qs.stringify(data),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      
      this.logger.log('Logout successful');
    } catch (error) {
      this.logger.error('Logout failed:', error.response?.data || error.message);
      if (error.response) {
        this.logger.error(`Error status: ${error.response.status}`);
        this.logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      }
      // We don't throw here, just log the error
    }
  }
}
