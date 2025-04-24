import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { Public } from './public.decorator';
import { Request } from 'express';
import { IsNotEmpty, IsString } from 'class-validator';

class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly keycloakService: KeycloakService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponse> {
    try {
      console.log('Login attempt with data:', JSON.stringify(loginDto));

      if (!loginDto.username || !loginDto.password) {
        console.log('Missing username or password');
        throw new HttpException('Username and password are required', HttpStatus.BAD_REQUEST);
      }

      return await this.keycloakService.login(loginDto.username, loginDto.password);
    } catch (error) {
      console.error('Login error:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data?.error_description || error.message || 'Authentication failed',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }): Promise<TokenResponse> {
    return this.keycloakService.refreshToken(body.refresh_token);
  }

  @Public()
  @Post('logout')
  async logout(@Body() body: { refresh_token: string }): Promise<{ success: boolean }> {
    await this.keycloakService.logout(body.refresh_token);
    return { success: true };
  }

  @Get('me')
  async getProfile(@Req() request: Request): Promise<any> {
    console.log('works');
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }
    return this.keycloakService.getUserInfo(token);
  }

  @Get('admin-resource')
  @Roles('admin')
  getAdminResource(): { message: string } {
    return { message: 'This is a protected admin resource' };
  }

  @Get('instructor-resource')
  @Roles('instructor', 'admin')
  getInstructorResource(): { message: string } {
    return { message: 'This is a protected instructor resource' };
  }

  @Get('student-resource')
  @Roles('student', 'instructor', 'admin')
  getStudentResource(): { message: string } {
    return { message: 'This is a protected student resource' };
  }
}
