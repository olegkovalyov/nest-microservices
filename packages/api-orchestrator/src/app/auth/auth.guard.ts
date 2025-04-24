import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  
  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Processing request to: ${request.method} ${request.url}`);
    
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Route is marked as public, skipping authentication');
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.debug('No authorization header found');
      throw new UnauthorizedException('No token provided');
    }

    this.logger.debug(`Authorization header: ${authHeader.substring(0, 20)}...`);
    
    // Fix for handling "Bearer Bearer token" format
    let token = '';
    if (authHeader.startsWith('Bearer Bearer ')) {
      token = authHeader.substring('Bearer Bearer '.length);
      this.logger.debug('Detected duplicated Bearer prefix, extracting token');
    } else if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring('Bearer '.length);
    } else {
      this.logger.debug(`Invalid token format: ${authHeader.substring(0, 20)}...`);
      throw new UnauthorizedException('Invalid token format');
    }

    if (!token) {
      this.logger.debug('Empty token after parsing');
      throw new UnauthorizedException('Invalid token format');
    }

    this.logger.debug(`Validating token: ${token.substring(0, 10)}...`);
    const isValid = await this.keycloakService.validateToken(token);

    if (!isValid) {
      this.logger.debug('Token validation failed');
      throw new UnauthorizedException('Invalid token');
    }

    this.logger.debug('Token is valid, checking roles if required');
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.debug('No roles required for this route');
      return true;
    }

    try {
      this.logger.debug(`Required roles for this route: ${requiredRoles.join(', ')}`);
      const userInfo = await this.keycloakService.getUserInfo(token);
      const userRoles = userInfo.realm_access?.roles || [];
      this.logger.debug(`User roles: ${userRoles.join(', ')}`);

      const hasRequiredRole = requiredRoles.some((role: string) => userRoles.includes(role));

      if (!hasRequiredRole) {
        this.logger.debug('User does not have the required roles');
        throw new ForbiddenException('Insufficient permissions');
      }

      // Attach user to request for potential use in controllers
      request.user = userInfo;
      
      this.logger.debug('Authentication and authorization successful');
      return true;
    } catch (error) {
      this.logger.error(`Role validation failed: ${error.message}`);
      throw new UnauthorizedException('Failed to validate user roles');
    }
  }
} 