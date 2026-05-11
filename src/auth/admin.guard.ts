import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { UserRole } from '../users/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Unauthorized ❌');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admins only 🚫');
    }

    return true;
  }
}