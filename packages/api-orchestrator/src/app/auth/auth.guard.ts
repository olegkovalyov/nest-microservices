import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const isValid = await this.keycloakService.validateToken(token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    // Get roles from metadata
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    // Get user info and check roles
    const userInfo = await this.keycloakService.getUserInfo(token);
    const hasRole = roles.some(role => userInfo.realm_access?.roles?.includes(role));
    
    if (!hasRole) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    // Attach user info to request
    request.user = userInfo;
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 