import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserRequest, UserResponse, GetUserRequest } from './user.pb';
import axios from 'axios';
import { Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserServiceService {
  private readonly logger = new Logger(UserServiceService.name);
  private producer: Producer;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    // Init Kafka producer
    const kafka = new Kafka({ brokers: [String(this.configService.get('KAFKA_BROKER'))] });
    this.producer = kafka.producer();
    this.producer.connect();
  }

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    // 1. Create user in Auth0
    let auth0UserId: string | null = null;
    try {
      const auth0Res = await axios.post(
        `https://${this.configService.get('AUTH0_DOMAIN')}/api/v2/users`,
        {
          email: data.email,
          name: data.name,
          password: data.password,
          connection: this.configService.get('AUTH0_CONNECTION'),
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('AUTH0_MGMT_TOKEN')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      auth0UserId = auth0Res.data.user_id;
    } catch (err) {
      this.logger.error('Auth0 user creation failed', err);
      throw new InternalServerErrorException('Auth0 user creation failed');
    }

    // 2. Create user in DB
    let user: User;
    try {
      user = this.userRepo.create({
        id: String(auth0UserId),
        email: data.email,
        name: data.name,
        roles: ['user'],
      });
      await this.userRepo.save(user);
    } catch (err) {
      this.logger.error('DB user creation failed, rolling back Auth0', err);
      // Rollback: delete user in Auth0
      if (auth0UserId) {
        try {
          await axios.delete(
            `https://${this.configService.get('AUTH0_DOMAIN')}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
            {
              headers: {
                Authorization: `Bearer ${this.configService.get('AUTH0_MGMT_TOKEN')}`,
              },
            },
          );
        } catch (e) {
          this.logger.error('Auth0 rollback failed', e);
        }
      }
      throw new InternalServerErrorException('DB user creation failed');
    }

    // 3. Publish USER_CREATED event to Kafka
    try {
      await this.producer.send({
        topic: 'user-events',
        messages: [
          {
            value: JSON.stringify({
              type: 'USER_CREATED',
              data: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
              metadata: {
                timestamp: new Date().toISOString(),
                correlationId: null,
              },
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error('Failed to publish USER_CREATED event', err);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getUser(data: GetUserRequest): Promise<UserResponse> {
    const user = await this.userRepo.findOne({ where: { id: data.id } });
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
