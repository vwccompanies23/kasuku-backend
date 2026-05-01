import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const user = req.user; // 🔥 from JWT

    if (!user) {
      throw new ForbiddenException('Unauthorized ❌');
    }

    // ✅ check admin from token
    if (!user.isAdmin && user.role !== 'admin') {
      throw new ForbiddenException('Admins only 🚫');
    }

    return true;
  }
}