import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { Public } from './public.decorator';
import { Request } from 'express';
import { IsNotEmpty, IsString } from 'class-validator';
import axios from 'axios';

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

  @Public()
  @Post('validate-token')
  async validateToken(@Body() body: { token: string }): Promise<{ valid: boolean; details?: any }> {
    try {
      const isValid = await this.keycloakService.validateToken(body.token);
      
      if (isValid) {
        const userInfo = await this.keycloakService.getUserInfo(body.token);
        return { valid: true, details: userInfo };
      }
      
      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }

  @Get('me')
  async getProfile(@Req() request: Request): Promise<any> {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
      }
      
      // Extract token, handling duplicated Bearer prefix case
      let token = '';
      if (authHeader.startsWith('Bearer Bearer ')) {
        token = authHeader.substring('Bearer Bearer '.length);
        console.log('Detected duplicated Bearer prefix, extracting token');
      } else if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring('Bearer '.length);
      } else {
        throw new HttpException('Invalid token format', HttpStatus.UNAUTHORIZED);
      }
      
      if (!token) {
        throw new HttpException('Empty token after parsing', HttpStatus.UNAUTHORIZED);
      }
      
      console.log(`Getting profile for token: ${token.substring(0, 10)}...`);
      const userInfo = await this.keycloakService.getUserInfo(token);
      console.log('Successfully retrieved user info');
      return userInfo;
    } catch (error) {
      console.error('Error getting user profile:', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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

  @Public()
  @Post('debug-token')
  async debugToken(@Body() body: { token: string }): Promise<any> {
    try {
      if (!body.token) {
        return { error: 'No token provided' };
      }
      
      const token = body.token.startsWith('Bearer ') 
        ? body.token.substring(7) 
        : body.token;
      
      // First try to validate with userinfo
      try {
        const userInfoUrl = `${this.keycloakService['keycloakUrl']}/realms/${this.keycloakService['realm']}/protocol/openid-connect/userinfo`;
        
        const userInfoResponse = await axios.get(userInfoUrl, {
          headers: { 
            Authorization: `Bearer ${token}` 
          },
          validateStatus: () => true // Accept any status code
        });
        
        return {
          token_preview: token.substring(0, 10) + '...',
          userinfo_endpoint: userInfoUrl,
          userinfo_status: userInfoResponse.status,
          userinfo_response: userInfoResponse.data,
          is_valid: userInfoResponse.status === 200
        };
      } catch (error) {
        return {
          token_preview: token.substring(0, 10) + '...',
          error: error.message,
          is_valid: false
        };
      }
    } catch (error) {
      return { error: error.message, is_valid: false };
    }
  }
}
