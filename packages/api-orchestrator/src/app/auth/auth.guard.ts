import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    const isValid = await this.keycloakService.validateToken(token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    try {
      const userInfo = await this.keycloakService.getUserInfo(token);
      const userRoles = userInfo.realm_access?.roles || [];

      const hasRequiredRole = requiredRoles.some((role: string) => userRoles.includes(role));

      if (!hasRequiredRole) {
        throw new ForbiddenException('Insufficient permissions');
      }

      // Attach user to request for potential use in controllers
      request.user = userInfo;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Failed to validate user roles');
    }
  }
} 