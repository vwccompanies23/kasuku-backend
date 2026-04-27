import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader =
      request.headers.authorization || request.headers.Authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token ❌');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bad token format ❌');
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET, // 🔥 FORCE MATCH
      });

      request.user = decoded;

      return true;
    } catch (e) {
      console.log('JWT ERROR:', e.message);
      throw new UnauthorizedException('Invalid token ❌');
    }
  }
}