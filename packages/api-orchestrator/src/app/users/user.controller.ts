import { Controller, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() userData: any) {
    return this.userService.createUser(userData);
  }

  @Put(':id')
  async updateUser(@Param('id') userId: string, @Body() userData: any) {
    return this.userService.updateUser(userId, userData);
  }

  @Delete(':id')
  async deleteUser(@Param('id') userId: string) {
    return this.userService.deleteUser(userId);
  }
}
