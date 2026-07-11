import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as jwksRsa from 'jwks-rsa';
import { JwtPayload } from '../../interfaces/auth/jwt-payload.interface';
import { RequestUser } from '../../interfaces/auth/request-user.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const domain = configService.get<string>('AUTH0_DOMAIN');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
      audience: 'https://bugflow-api',
      issuer: `https://${domain}/`,
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<RequestUser> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const accessToken = authHeader.split(' ')[1];
    const roles = payload['https://bugflow-api/roles'] || [];
    const dbUser = await this.usersService.findOrCreateFromAuth0({
      ...payload,
      accessToken,
      roles,
    });

    return {
      ...payload,
      accessToken,
      roles,
      dbUser,
    };
  }
}
