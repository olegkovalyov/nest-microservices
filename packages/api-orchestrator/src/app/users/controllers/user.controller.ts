import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  Logger, UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  UserResponse
} from '@app/common/grpc/user/user-service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import {AuthGuard} from '../../auth/auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  /**
   * gRPC: Create user via user-service
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict. User already exists.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async createUser(@Body() userDto: CreateUserDto) {
    this.logger.log('Received CreateUser request in orchestrator');
    return this.userService.createUser(userDto);
  }

  /**
   * gRPC: Get user via user-service
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  @UseGuards(AuthGuard)
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponse> {
    this.logger.log(`Received GetUser request in orchestrator for ID: ${id}`);
    return this.userService.getUser(id);
  }

  /**
   * Update user via user-service
   */
  @Put(':id')
  async updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() userData: UpdateUserDto) {
    return this.userService.updateUser(id, userData);
  }
}
