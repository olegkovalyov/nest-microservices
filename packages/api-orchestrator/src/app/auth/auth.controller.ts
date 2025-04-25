import {Controller, Post, Body, UseGuards, Req, Get, UnauthorizedException, Res} from '@nestjs/common';
import {AuthService} from './auth.service';
import {AuthGuard} from './auth.guard';
import {LoginDto} from './dto/login.dto';
import {LogoutDto} from './dto/logout.dto';
import {Result} from '@app/common/result';
import {Request} from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(dto);
    if (!result.success) {
      throw new UnauthorizedException(result.error.message);
    }
    const { refresh_token, ...rest } = result.value;
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true, // только по HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
    });
    return rest;
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const result = await this.authService.refresh({ refresh_token: refreshToken });
    if (!result.success) {
      throw new UnauthorizedException(result.error.message);
    }
    const { refresh_token, ...rest } = result.value;
    if (refresh_token) {
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }
    return rest;
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const result = await this.authService.logout({ refresh_token: refreshToken });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });
    if (!result.success) {
      throw new UnauthorizedException(result.error.message);
    }
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const result = await this.authService.me(req);
    if (!result.success) {
      throw new UnauthorizedException(result.error.message);
    }
    return result.value;
  }
}
