import {Injectable, Logger} from '@nestjs/common';
import {InjectRedis} from '@nestjs-modules/ioredis';
import {ConfigService} from '@nestjs/config';
import Redis from 'ioredis';
import {Auth0MgmtTokenService} from './auth0-mgmt-token.service';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from '../user/user.entity';
import {Repository} from 'typeorm';
import axios from 'axios';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserDto } from '../user/dto/user.dto';
import { Result, success, failure } from '@app/common/result';

@Injectable()
export class Auth0UserService {
  private readonly logger = new Logger(Auth0UserService.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly auth0MgmtTokenService: Auth0MgmtTokenService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
  }

  async createUserInAuth0AndDb(
    createUserDto: CreateUserDto,
  ): Promise<Result<UserDto, Error>> {
    try {
      const mgmtTokenResult = await this.auth0MgmtTokenService.getMgmtToken();
      if (!mgmtTokenResult.success) {
        const errMsg = 'Failed to get Auth0 mgmt token';
        this.logger.error(errMsg, mgmtTokenResult.error);
        return failure(new Error(`Failed to get Auth0 mgmt token: ${mgmtTokenResult.error?.message}`));
      }
      const mgmtToken = mgmtTokenResult.value;

      const domain = this.configService.get<string>('AUTH0_DOMAIN');
      const connection = this.configService.get<string>('AUTH0_CONNECTION');
      const url = `https://${domain}/api/v2/users`;

      const payload = {
        email: createUserDto.email,
        password: createUserDto.password,
        connection,
        given_name: createUserDto.firstName,
        family_name: createUserDto.lastName,
        // Auth0 'name' field might be optional or derived, let's use firstName + lastName
        name: `${createUserDto.firstName || ''} ${createUserDto.lastName || ''}`.trim(),
      };

      const headers = {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json',
      };
      const response = await axios.post(url, payload, {headers});
      const auth0User = response.data;

      this.logger.debug('Auth0 user created: ', auth0User.user_id);

      const user = this.userRepository.create({
        identity_provider_id: auth0User.user_id,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        roles: createUserDto.roles || ['user'], // Use default roles if not provided
      });
      await this.userRepository.save(user);
      this.logger.log(`User saved to DB with id: ${user.id}`);

      // Map User entity to UserDto
      const userDto: UserDto = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        // Ensure Date objects are returned if UserDto expects them, otherwise use .toISOString()
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return success(userDto);
    } catch (err) {
      this.logger.error('Failed to create user in Auth0 and DB', (err as unknown as Error).message);
      return failure(new Error(`Failed to create user: ${(err as Error)?.message}`));
    }
  }
}
