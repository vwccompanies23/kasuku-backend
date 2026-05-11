import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SubscriptionGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const user = request.user;

    // ❌ NO USER
    if (!user) {
      throw new ForbiddenException(
        'No user found ❌',
      );
    }

    // ✅ ADMIN BYPASS
    if (
      user.id === 1 ||
      user.userId === 1 ||
      user.role === 'admin'
    ) {
      return true;
    }

    // ✅ FREE OVERRIDE
    if (user.isFreeOverride) {
      return true;
    }

    // ❌ NO ACTIVE SUBSCRIPTION
    if (
      !user.subscriptionActive ||
      user.subscriptionStatus !==
        'active'
    ) {
      throw new ForbiddenException(
        'Upgrade to Pro 🚀',
      );
    }

    return true;
  }
}