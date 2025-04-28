import {Injectable, Logger} from '@nestjs/common';
import {UserGrpcClientService} from './user.grpc-client';
import { CreateUserRequest, UpdateUserRequest, UserResponse, GetUserRequest } from '@app/common/grpc/user/user-service';
import {CreateUserDto} from '../dto/create-user.dto';
import {UpdateUserDto} from '../dto/update-user.dto';
import {RpcException} from '@nestjs/microservices';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userGrpcClient: UserGrpcClientService,
  ) {
  }

  /**
   * gRPC: Create user via user-service
   */
  async createUser(userDto: CreateUserDto): Promise<UserResponse> {
    try {
      this.logger.log('Creating new user via gRPC');
      const grpcPayload: CreateUserRequest = {
        email: userDto.email,
        password: userDto.password,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
      };
      const user: UserResponse = await this.userGrpcClient.createUser(grpcPayload);
      return user;
    } catch (error) {
      this.logger.error('Error creating user via gRPC:', error);

      if ((error as any)?.code !== undefined) {
        throw new RpcException({
          code: (error as any).code,
          message: (error as any).details || (error as any).message
        });
      }
      throw new RpcException({ code: 500, message: 'Internal server error during user creation' });
    }
  }

  /**
   * gRPC: Get user via user-service
   */
  async getUser(userId: string): Promise<UserResponse> {
    try {
      this.logger.log(`Getting user ${userId} via gRPC`);
      const user: UserResponse = await this.userGrpcClient.getUser(userId);
      return user;
    } catch (error) {
      this.logger.error(`Error getting user ${userId} via gRPC:`, error);
      if ((error as any)?.code !== undefined) {
        throw new RpcException({
          code: (error as any).code,
          message: (error as any).details || (error as any).message
        });
      }
      throw new RpcException({ code: 500, message: 'Internal server error while getting user' });
    }
  }

  /**
   * gRPC: Update user via user-service
   */
  async updateUser(id: string, userData: UpdateUserDto): Promise<UserResponse> {
    try {
      this.logger.log(`Updating user ${id} via gRPC`);
      const updatePayload: UpdateUserRequest = {
        id,
        firstName: userData.firstName ?? '',
        lastName: userData.lastName ?? '',
      };
      const user: UserResponse = await this.userGrpcClient.updateUser(updatePayload);
      return user;
    } catch (error) {
      this.logger.error(`Error updating user ${id} via gRPC:`, error);
       if ((error as any)?.code !== undefined) {
        throw new RpcException({
          code: (error as any).code,
          message: (error as any).details || (error as any).message
        });
      }
      throw new RpcException({ code: 500, message: 'Internal server error during user update' });
    }
  }
}
