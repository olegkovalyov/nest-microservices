import {Injectable, Logger} from '@nestjs/common';
import {Auth0UserService} from '../auth/auth0-user.service';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserDto} from './dto/user.dto';
import {Result, failure} from '@app/common/result';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from './user.entity';
import {Repository} from 'typeorm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly auth0UserService: Auth0UserService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Result<UserDto, Error>> {
    this.logger.log(`Attempting to create user: ${createUserDto.email}`);
    const result = await this.auth0UserService.createUserInAuth0AndDb(
      createUserDto,
    );

    if (result.success) {
      this.logger.log(`Successfully created user ${result.value.id} for email ${result.value.email}`);
    } else {
      this.logger.error(`Failed to create user for email ${createUserDto.email}: ${result.error.message}`);
    }

    return result;
  }

  async getUser(id: string): Promise<Result<UserDto, Error>> {
    this.logger.warn(`getUser(${id}) not implemented yet`);
    return failure(new Error('Get user functionality not implemented'));
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Result<UserDto, Error>> {
    this.logger.warn(`updateUser(${id}) with data ${JSON.stringify(updateUserDto)} not implemented yet`);
    return failure(new Error('Update user functionality not implemented'));
  }
}
