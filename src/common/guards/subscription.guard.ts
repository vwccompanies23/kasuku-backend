import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // ❌ No user
    if (!user) {
      throw new ForbiddenException('No user found ❌');
    }

    // ✅ ADMIN / FREE OVERRIDE (VERY IMPORTANT)
    if (user.isFreeOverride) {
      return true;
    }

    // ❌ No active subscription
    if (
      !user.subscriptionActive ||
      user.subscriptionStatus !== 'active'
    ) {
      throw new ForbiddenException('Upgrade to Pro 🚀');
    }

    return true;
  }
}