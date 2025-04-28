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
import { status } from '@grpc/grpc-js'; // Import gRPC status codes
import { UserDto } from './dto/user.dto';

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
      // Handle errors returned from UserService
      const error = result.error;

      let grpcStatus = status.INTERNAL;
      const errorMessage = error.message || 'Unknown error during user creation.';

      // Check if the error message indicates a conflict (e.g., from Auth0)
      if (errorMessage.toLowerCase().includes('conflict')) {
        grpcStatus = status.ALREADY_EXISTS;
        // Log conflict only at debug level as it's handled gracefully
        this.logger.debug(`Conflict detected during user creation: ${errorMessage}`);
      } else {
        // Log only unexpected errors at the error level
        this.logger.error(`Unexpected error during user creation: ${errorMessage}`, error.stack);
      }

      // Throw RpcException with the determined status and the original error message
      throw new RpcException({
        message: errorMessage + 'test',
        code: grpcStatus,
      });
    }
  }

  @GrpcMethod('UserService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<UserResponse> {
    this.logger.log(`Received GetUser request for ID: ${request.id}`);

    const result = await this.userService.getUser(request.id);

    if (result.success) {
      const userDto = result.value;
      this.logger.log(`Successfully retrieved user: ${userDto.email}`);
      // Map DTO to gRPC Response
      const userResponse: UserResponse = {
        id: userDto.id,
        email: userDto.email,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        roles: userDto.roles,
        createdAt: userDto.createdAt.toISOString(), // Convert Date to ISO string
      };
      return userResponse;
    } else {
      // Handle errors
      const error = result.error;
      const errorMessage = error.message || 'Unknown error during user retrieval.';
      let grpcStatus = status.INTERNAL;

      // Check specifically for 'not found' errors
      if (errorMessage.toLowerCase().includes('not found')) {
        grpcStatus = status.NOT_FOUND;
        this.logger.warn(`User not found for ID ${request.id}: ${errorMessage}`);
      } else {
        // Log other internal errors
        this.logger.error(
          `Error retrieving user with ID ${request.id}: ${errorMessage}`,
          error.stack,
        );
      }

      throw new RpcException({
        message: errorMessage,
        code: grpcStatus,
      });
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
      // TODO: Implement specific error mapping for UpdateUser if needed (e.g., NOT_FOUND, ALREADY_EXISTS for email change?)
      // For now, treat all errors as internal
      throw new RpcException({
        message: error.message || 'Failed to update user due to an internal error.',
        code: status.INTERNAL,
      });
    }
  }
}
