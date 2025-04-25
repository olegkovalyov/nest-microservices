import {Injectable, CanActivate, ExecutionContext, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

const getJwksClient = (domain: string) => jwksRsa({
  jwksUri: `https://${domain}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

function getKey(
  client: jwksRsa.JwksClient,
  header: jwt.JwtHeader,
  callback: (err: Error | null, key?: string) => void,
) {
  client.getSigningKey(header.kid as string, (err, key) => {
    if (err) {
      return callback(err);
    }
    if (!key) {
      return callback(new Error('Signing key not found'));
    }
    callback(null, key.getPublicKey());
  });
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('No Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const domain = this.configService.get('AUTH0_DOMAIN');
    const audience = this.configService.get('AUTH0_AUDIENCE');
    const issuer = `https://${domain}/`;
    const client = getJwksClient(domain);
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, cb) => getKey(client, header, cb),
        {
          audience,
          issuer,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            return reject(new UnauthorizedException('Invalid token'));
          }
          request.user = decoded;
          resolve(true);
        },
      );
    });
  }
}
