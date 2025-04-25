import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

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
      message: 'Authentication and authorization are now handled by Auth0 (cloud IdP).',
      endpoints: {
        login: '/api/v1/auth/login',
        refresh: '/api/v1/auth/refresh',
        logout: '/api/v1/auth/logout',
        me: '/api/v1/auth/me'
      }
    };
  }

  @Get('protected')
  getProtected() {
    return { message: 'You are authenticated via Auth0!' };
  }
}

