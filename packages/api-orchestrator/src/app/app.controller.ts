import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('auth-info')
  getAuthInfo() {
    return {
      message: 'Authentication is handled by Auth0',
      endpoints: {
        login: '/api/v1/auth/login',
        refresh: '/api/v1/auth/refresh',
        logout: '/api/v1/auth/logout',
        me: '/api/v1/auth/me'
      }
    };
  }

  @Get('auth/me')
  getMe(@Req() req: Request) {
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      return { success: true };
    }
    throw new UnauthorizedException();
  }
}

