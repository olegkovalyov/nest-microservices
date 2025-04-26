import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';
import {
  CreateUserRequest,
  GetUserRequest,
  UpdateUserRequest,
  UserResponse,
} from './grpc/user-service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'CreateUser')
  createUser(request: CreateUserRequest): Promise<UserResponse> {
    return this.userService.createUser(request);
  }

  @GrpcMethod('UserService', 'GetUser')
  getUser(request: GetUserRequest): Promise<UserResponse> {
    return this.userService.getUser(request);
  }

  @GrpcMethod('UserService', 'UpdateUser')
  updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    return this.userService.updateUser(request);
  }
}
