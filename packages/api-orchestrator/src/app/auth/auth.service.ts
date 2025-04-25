import {Injectable} from '@nestjs/common';
import axios from 'axios';
import {ConfigService} from '@nestjs/config';
import {Result, success, failure} from '@app/common/result';
import {LoginDto} from './dto/login.dto';
import {LogoutDto} from './dto/logout.dto';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {
  }

  async login(dto: LoginDto): Promise<Result<any, Error>> {
    const clientId = this.configService.get('AUTH0_CLIENT_ID');
    const clientSecret = this.configService.get('AUTH0_CLIENT_SECRET');
    const domain = this.configService.get('AUTH0_DOMAIN');
    try {
      const resp = await axios.post(`https://${domain}/oauth/token`, {
        grant_type: 'password',
        username: dto.username,
        password: dto.password,
        client_id: clientId,
        client_secret: clientSecret,
        audience: this.configService.get('AUTH0_AUDIENCE'),
        scope: 'openid profile email offline_access',
      });
      return success(resp.data);
    } catch (e: any) {
      return failure(new Error(e.response?.data?.error_description || 'Invalid credentials'));
    }
  }

  async refresh(dto: LogoutDto): Promise<Result<any, Error>> {
    const clientId = this.configService.get('AUTH0_CLIENT_ID');
    const clientSecret = this.configService.get('AUTH0_CLIENT_SECRET');
    const domain = this.configService.get('AUTH0_DOMAIN');
    try {
      const resp = await axios.post(`https://${domain}/oauth/token`, {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: dto.refresh_token,
      });
      return success(resp.data);
    } catch (e: any) {
      return failure(new Error(e.response?.data?.error_description || 'Invalid refresh token'));
    }
  }

  async logout(dto: LogoutDto): Promise<Result<true, Error>> {
    const domain = this.configService.get('AUTH0_DOMAIN');
    const clientId = this.configService.get('AUTH0_CLIENT_ID');
    const clientSecret = this.configService.get('AUTH0_CLIENT_SECRET');
    try {
      await this.revokeUserRefreshToken(
        domain,
        clientId,
        clientSecret,
        dto.refresh_token,
      );
      return success(true);
    } catch (e: any) {
      return failure(new Error(e.response?.data?.error_description || 'Invalid credentials'));
    }
  }

  async revokeUserRefreshToken(
    domain: string,
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<void> {
    await axios.post(
      `https://${domain}/oauth/revoke`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        token: refreshToken,
      },
      {
        headers: {'Content-Type': 'application/json'},
      },
    );
  }

  async me(req: any): Promise<Result<any, Error>> {
    const domain = this.configService.get('AUTH0_DOMAIN');
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      return failure(new Error('No token'));
    }
    try {
      const resp = await axios.get(`https://${domain}/userinfo`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      return success(resp.data);
    } catch (e: any) {
      return failure(new Error('Invalid token'));
    }
  }
}
