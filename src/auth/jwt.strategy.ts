import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRole } from '../users/user-role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: {
    userId: number;
    email: string;
    role: UserRole;
  }) {
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }
}