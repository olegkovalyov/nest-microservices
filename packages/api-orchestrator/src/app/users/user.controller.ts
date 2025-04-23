import { Controller, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  async createUser(@Body() userData: any) {
    return this.userService.createUser(userData);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  async updateUser(@Param('id') userId: string, @Body() userData: any) {
    return this.userService.updateUser(userId, userData);
  }

  @Delete(':id')
  @Roles('admin')
  async deleteUser(@Param('id') userId: string) {
    return this.userService.deleteUser(userId);
  }
} 