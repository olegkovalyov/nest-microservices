import { Controller, BadRequestException } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserServiceService } from './user.service';
import { CreateUserRequest, UserResponse, GetUserRequest } from './user.pb';
import { CreateUserDto, GetUserDto } from './user.dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Controller()
export class UserServiceController {
  constructor(private readonly userService: UserServiceService) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const dto = plainToInstance(CreateUserDto, data);
    const errors = validateSync(dto);
    if (errors.length) {
      throw new BadRequestException(errors);
    }
    return this.userService.createUser(data);
  }

  @GrpcMethod('UserService', 'GetUser')
  async getUser(data: GetUserRequest): Promise<UserResponse> {
    const dto = plainToInstance(GetUserDto, data);
    const errors = validateSync(dto);
    if (errors.length) {
      throw new BadRequestException(errors);
    }
    return this.userService.getUser(data);
  }
}
