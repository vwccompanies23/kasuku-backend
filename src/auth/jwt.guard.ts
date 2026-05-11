import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { UserRole } from '../users/user-role.enum';

interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context.switchToHttp().getRequest();

    const authHeader =
      request.headers.authorization ||
      request.headers.Authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'No token ❌',
      );
    }

    const [type, token] =
      authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Bad token format ❌',
      );
    }

    try {
      const decoded =
        this.jwtService.verify<JwtPayload>(
          token,
          {
            secret:
              process.env.JWT_SECRET,
          },
        );

      request.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      return true;
    } catch (e) {
      console.log(
        'JWT ERROR:',
        e.message,
      );

      throw new UnauthorizedException(
        'Invalid token ❌',
      );
    }
  }
}