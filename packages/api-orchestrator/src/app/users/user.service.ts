import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly kafkaService: KafkaService) {}

  async createUser(userData: any) {
    try {
      this.logger.log('Creating new user');
      // Emit user creation event
      await this.kafkaService.emitEvent('user.created', userData);
      return { message: 'User creation initiated', data: userData };
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: any) {
    try {
      this.logger.log(`Updating user ${userId}`);
      // Emit user update event
      await this.kafkaService.emitEvent('user.updated', { userId, ...userData });
      return { message: 'User update initiated', data: { userId, ...userData } };
    } catch (error) {
      this.logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      this.logger.log(`Deleting user ${userId}`);
      // Emit user deletion event
      await this.kafkaService.emitEvent('user.deleted', { userId });
      return { message: 'User deletion initiated', userId };
    } catch (error) {
      this.logger.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }
} 