import {Injectable, Logger} from '@nestjs/common';
import {KafkaService} from '../../kafka/kafka.service';
import {UserGrpcClientService} from './user.grpc-client';
import { CreateUserRequest, UpdateUserRequest, UserResponse } from '../../grpc/user-service';
import {CreateUserDto} from '../dto/create-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly userGrpcClient: UserGrpcClientService,
  ) {
  }

  /**
   * gRPC: Create user via user-service
   * Calls user-service CreateUser method synchronously for consistency.
   * Also emits Kafka event asynchronously for other consumers.
   */
  async createUser(userDto: CreateUserDto) {
    try {
      this.logger.log('Creating new user via gRPC');
      const grpcPayload: CreateUserRequest = {
        email: userDto.email,
        password: userDto.password,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
      };
      const user: UserResponse = await this.userGrpcClient.createUser(grpcPayload);
      // Optionally emit event for other services
      await this.kafkaService.emitEvent('user.created', user);
      return {message: 'User created', data: {firstName: user.firstName, lastName: user.lastName}};
    } catch (error) {
      this.logger.error('Error creating user via gRPC:', error);
      throw error;
    }
  }

  /**
   * gRPC: Get user via user-service
   */
  async getUser(userId: string) {
    try {
      this.logger.log(`Getting user ${userId} via gRPC`);
      const user: UserResponse = await this.userGrpcClient.getUser(userId);
      return {message: 'User fetched', data: {firstName: user.firstName, lastName: user.lastName}};
    } catch (error) {
      this.logger.error(`Error getting user ${userId} via gRPC:`, error);
      throw error;
    }
  }

  /**
   * gRPC: Update user via user-service
   */
  async updateUser(id: string, userData: Partial<UpdateUserRequest>) {
    try {
      this.logger.log(`Updating user ${id} via gRPC`);
      const updatePayload: UpdateUserRequest = {
        id,
        email: userData.email ?? '',
        firstName: userData.firstName ?? '',
        lastName: userData.lastName ?? '',
      };
      const user: UserResponse = await this.userGrpcClient.updateUser(updatePayload);
      // Optionally emit event for other services (already done in user-service)
      return {message: 'User updated', data: {firstName: user.firstName, lastName: user.lastName}};
    } catch (error) {
      this.logger.error(`Error updating user ${id} via gRPC:`, error);
      throw error;
    }
  }
}
