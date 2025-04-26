import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * gRPC: Create user via user-service
   */
  @Post()
  async createUser(@Body() userDto: CreateUserDto) {
    return this.userService.createUser(userDto);
  }

  /**
   * gRPC: Get user via user-service
   */
  @Get(':id')
  async getUser(@Param('id') userId: string) {
    return this.userService.getUser(userId);
  }

  /**
   * Update user via user-service
   */
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    // Optionally add DTO validation here
    return this.userService.updateUser(id, userData);
  }
}
