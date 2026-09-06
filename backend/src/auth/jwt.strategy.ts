import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'groww_smart_watchlist_super_secret_key_2026'),
    });
  }

  async validate(payload: { sub: string; email: string; name: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid JWT token');
    }
    return { userId: payload.sub, email: payload.email, name: payload.name };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
