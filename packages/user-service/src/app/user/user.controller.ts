import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';
import {
  CreateUserRequest,
  GetUserRequest,
  UpdateUserRequest,
  UserResponse,
} from './grpc/user-service'; // Keep gRPC types for the controller layer
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto'; // Import UpdateUserDto
import { RpcException } from '@nestjs/microservices'; // Import RpcException

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'CreateUser') // Added missing decorator
  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    this.logger.log(`Received CreateUser request for email: ${request.email}`);

    // 1. Map gRPC request to internal DTO (direct mapping)
    const createUserDto: CreateUserDto = {
      email: request.email,
      password: request.password, // Be mindful of sending passwords over the wire
      firstName: request.firstName,
      lastName: request.lastName,
      // roles: request.roles || [], // Removed: 'roles' does not exist on CreateUserRequest type
    };

    // 2. Call the service method
    const result = await this.userService.createUser(createUserDto);

    // 3. Handle the Result
    if (result.success) {
      const userDto = result.value;
      // 4. Map successful DTO back to gRPC Response (direct mapping)
      return {
        id: userDto.id,
        email: userDto.email,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        roles: userDto.roles,
        createdAt: userDto.createdAt.toISOString(), // Convert Date to ISO string
      };
    } else {
      // 5. Handle failure - Log and throw RpcException
      const error = result.error;
      this.logger.error(
        `CreateUser failed for email ${request.email}: ${error.message}`,
        error.stack, // Log the main error stack
      );
      // Provide a user-friendly error message via RpcException
      throw new RpcException(
        error.message || 'Failed to create user due to an internal error.', // Use specific or generic message
      );
    }
  }

  @GrpcMethod('UserService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<UserResponse> {
    this.logger.log(`Received GetUser request for id: ${request.id}`);
    const result = await this.userService.getUser(request.id);

    if (result.success) {
      const userDto = result.value;
      // Map DTO to gRPC Response
      return {
        id: userDto.id,
        email: userDto.email,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        roles: userDto.roles,
        createdAt: userDto.createdAt.toISOString(),
      };
    } else {
      const error = result.error;
      this.logger.error(
        `GetUser failed for id ${request.id}: ${error.message}`,
        error.stack, // Log the main error stack
      );
      throw new RpcException(
        error.message || 'Failed to get user due to an internal error.',
      );
    }
  }

  @GrpcMethod('UserService', 'UpdateUser')
  async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    this.logger.log(`Received UpdateUser request for id: ${request.id}`);

    // 1. Map gRPC request to internal DTO
    const updateUserDto: UpdateUserDto = {
      firstName: request.firstName || undefined, // Pass firstName if provided
      lastName: request.lastName || undefined,   // Pass lastName if provided
    };

    // Check if DTO is effectively empty (only contains undefined values)
    // We allow sending empty request to potentially trigger 'not found' later
    // Alternatively, add validation here if needed.
    if (Object.keys(updateUserDto).length === 0) {
      throw new RpcException('Update request must contain at least one field to update (e.g., firstName, lastName, roles).');
    }

    // 2. Call the service method
    const result = await this.userService.updateUser(request.id, updateUserDto);

    // 3. Handle the Result
    if (result.success) {
      const userDto = result.value;
      // 4. Map successful DTO back to gRPC Response
      return {
        id: userDto.id,
        email: userDto.email,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        roles: userDto.roles,
        createdAt: userDto.createdAt.toISOString(),
      };
    } else {
      const error = result.error;
      this.logger.error(
        `UpdateUser failed for id ${request.id}: ${error.message}`,
        error.stack, // Log the main error stack
      );
      throw new RpcException(
        error.message || 'Failed to update user due to an internal error.',
      );
    }
  }
}
