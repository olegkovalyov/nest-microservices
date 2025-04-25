import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        // Используем jwks-rsa для получения публичного ключа Auth0
        const jwksRsa = require('jwks-rsa');
        const jwt = require('jsonwebtoken');
        const domain = configService.get('AUTH0_DOMAIN');
        const client = jwksRsa({
          jwksUri: `https://${domain}/.well-known/jwks.json`,
          cache: true,
          rateLimit: true,
        });
        const decoded = jwt.decode(rawJwtToken, { complete: true });
        if (!decoded || !decoded.header || !decoded.header.kid) {
          return done(new Error('Invalid token header'));
        }
        client.getSigningKey(decoded.header.kid, (err: any, key: { getPublicKey: () => string | Buffer<ArrayBufferLike> | undefined; }) => {
          if (err) return done(err);
          if (!key) return done(new Error('Signing key not found'));
          done(null, key.getPublicKey());
        });
      },
      algorithms: ['RS256'],
      audience: configService.get('AUTH0_AUDIENCE'),
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
