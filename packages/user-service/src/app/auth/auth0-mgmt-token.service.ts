import {Injectable, Logger} from '@nestjs/common';
import {InjectRedis} from '@nestjs-modules/ioredis';
import {ConfigService} from '@nestjs/config';
import Redis from 'ioredis';
import axios from 'axios';
import {failure, Result, success} from '@app/common/result';

@Injectable()
export class Auth0MgmtTokenService {
  private readonly logger = new Logger(Auth0MgmtTokenService.name);
  private readonly cacheKey: string;
  private readonly ttl: number;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.cacheKey = this.configService.get<string>('AUTH0_MGMT_TOKEN_CACHE_KEY', 'auth0:mgmt_token');
    this.ttl = Number(this.configService.get<string>('AUTH0_MGMT_TOKEN_TTL', '85000'));
  }

  async getMgmtToken(): Promise<Result<string>> {
    // 1. Check cache
    const cached = await this.redis.get(this.cacheKey);
    if (cached) {
      return success(cached);
    }

    // 2. Request new token
    try {
      const url = `https://${this.configService.get<string>('AUTH0_DOMAIN')}/oauth/token`;
      const response = await axios.post(
        url,
        {
          grant_type: 'client_credentials',
          client_id: this.configService.get<string>('AUTH0_MGMT_CLIENT_ID'),
          client_secret: this.configService.get<string>('AUTH0_MGMT_CLIENT_SECRET'),
          audience: this.configService.get<string>('AUTH0_MGMT_AUDIENCE'),
        },
        {headers: {'Content-Type': 'application/json'}},
      );

      const token = response.data.access_token;
      // 3. Cache in Redis
      await this.redis.set(this.cacheKey, token, 'EX', this.ttl);
      return success(token);
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error('Failed to get Auth0 mgmt token', err.message);
        return failure(err);
      } else {
        this.logger.error('Failed to get Auth0 mgmt token', JSON.stringify(err));
        return failure(new Error('Failed to get Auth0 mgmt token'));
      }
    }
  }
}
