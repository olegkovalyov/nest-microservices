import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as qs from 'qs';
import KeycloakConnect from 'keycloak-connect';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private keycloak: any;
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string | undefined;

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL') || 'http://localhost:8080';
    this.realm = this.configService.get<string>('KEYCLOAK_REALM') || 'education';
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID') || 'postman-client';
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET');

    this.logger.log(`Initializing KeycloakService with: URL=${this.keycloakUrl}, realm=${this.realm}, clientId=${this.clientId}`);

    this.initializeKeycloak();
  }

  private initializeKeycloak() {
    const keycloakConfig = {
      realm: this.realm,
      'auth-server-url': this.keycloakUrl,
      'ssl-required': 'external',
      resource: this.clientId,
      'confidential-port': 0,
      'bearer-only': true,
    };

    const keycloakOptions = {
      store: {
        get: () => null,
      },
    };

    this.keycloak = new KeycloakConnect(keycloakOptions, keycloakConfig);
    this.logger.log('Keycloak initialized');
  }

  getKeycloakInstance(): any {
    return this.keycloak;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating token: ${token.substring(0, 10)}...`);
      this.logger.debug(`Using realm: ${this.realm}`);
      this.logger.debug(`Using Keycloak URL: ${this.keycloakUrl}`);

      // Use userinfo endpoint for validation instead of introspection
      // Many public clients don't have permission for token introspection
      const userInfoUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;
      this.logger.debug(`UserInfo endpoint: ${userInfoUrl}`);

      const response = await axios.get(
        userInfoUrl,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: status => status < 500, // Don't throw for 401/403 responses
        }
      );

      this.logger.debug(`Response status: ${response.status}`);

      if (response.status !== 200) {
        this.logger.error(`Token validation failed with status ${response.status}: ${JSON.stringify(response.data)}`);
        return false;
      }

      this.logger.debug(`Token validation successful: ${JSON.stringify(response.data)}`);
      return true;

    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      if (error.response) {
        this.logger.error(`Error status: ${error.response.status}`);
        this.logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }

  async getUserInfo(token: string): Promise<any> {
    try {
      // Get user info directly since the validation is already done in canActivate
      this.logger.debug(`Getting user info with token: ${token.substring(0, 10)}...`);
      const userInfoUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;
      this.logger.debug(`UserInfo endpoint: ${userInfoUrl}`);

      const response = await axios.get(
        userInfoUrl,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: status => status < 500,
        },
      );

      if (response.status !== 200) {
        this.logger.error(`Failed to get user info with status ${response.status}: ${JSON.stringify(response.data)}`);
        throw new UnauthorizedException('Invalid token');
      }

      this.logger.debug(`UserInfo successfully retrieved: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Failed to get user info: ${error.message}`);
      if (error.response) {
        this.logger.error(`Error status: ${error.response.status}`);
        this.logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      }
      throw new UnauthorizedException('Failed to retrieve user information');
    }
  }

  async login(username: string, password: string): Promise<TokenResponse> {
    try {
      this.logger.log(`Attempting to login user: ${username} with client ID: ${this.clientId}`);

      const data: Record<string, string> = {
        grant_type: 'password',
        client_id: this.clientId,
        scope: 'openid',
        username,
        password,
      };

      if (this.clientSecret) {
        data.client_secret = this.clientSecret;
      }

      this.logger.log(`Sending login request to Keycloak with data: ${JSON.stringify(data, null, 2)}`);
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

      this.logger.log('Login successful');
      return response.data;
    } catch (error) {
      this.logger.error('Login failed:', error.response?.data || error.message);
      if (error.response) {
        this.logger.error(`Error status: ${error.response.status}`);
        this.logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      this.logger.log(`Attempting to refresh token with client ID: ${this.clientId}`);

      const data: Record<string, string> = {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        refresh_token: refreshToken,
      };

      // Add client_secret only if it's set
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

      // Add client_secret only if it's set
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
