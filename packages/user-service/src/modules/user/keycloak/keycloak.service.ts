import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as qs from 'qs';

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL') || 'http://localhost:8080';
    this.realm = this.configService.get<string>('KEYCLOAK_REALM') || 'education';
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID') || 'education-app';
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET') || '';
  }

  async getUserInfo(token: string) {
    try {
      const response = await axios.get(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching user info: ${error.message}`);
      throw error;
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    try {
      // Получаем admin token
      const tokenResponse = await this.getAdminToken();
      
      // Создаем пользователя
      const response = await axios.post(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users`,
        {
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          enabled: true,
          emailVerified: false,
          credentials: [
            {
              type: 'password',
              value: userData.password,
              temporary: false,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Проверяем статус создания пользователя
      if (response.status === 201) {
        this.logger.log(`User ${userData.username} created successfully`);
        return { success: true, message: 'User created successfully' };
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  async updateUser(userId: string, userData: any) {
    try {
      // Получаем admin token
      const tokenResponse = await this.getAdminToken();
      
      // Обновляем пользователя
      const response = await axios.put(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      this.logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      // Получаем admin token
      const tokenResponse = await this.getAdminToken();
      
      // Получаем пользователя по ID
      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching user by id: ${error.message}`);
      throw error;
    }
  }

  async getUserByUsername(username: string) {
    try {
      // Получаем admin token
      const tokenResponse = await this.getAdminToken();
      
      // Поиск пользователя по имени пользователя
      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users?username=${username}`,
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        },
      );

      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      this.logger.error(`Error fetching user by username: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      // Получаем admin token
      const tokenResponse = await this.getAdminToken();
      
      // Удаляем пользователя
      const response = await axios.delete(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        },
      );

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }

  private async getAdminToken() {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        qs.stringify({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting admin token: ${error.message}`);
      throw error;
    }
  }
} 