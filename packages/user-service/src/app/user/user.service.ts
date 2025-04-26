import { Injectable } from '@nestjs/common';
import {
  CreateUserRequest,
  GetUserRequest,
  UpdateUserRequest,
  UserResponse,
} from './grpc/user-service';

@Injectable()
export class UserService {
  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    return {
      id: '1',
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      roles: ['user'],
      createdAt: new Date().toISOString(),
    };
  }

  async getUser(request: GetUserRequest): Promise<UserResponse> {
    return {
      id: request.id,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
      createdAt: new Date().toISOString(),
    };
  }

  async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    return {
      id: request.id,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      roles: ['user'],
      createdAt: new Date().toISOString(),
    };
  }
}
