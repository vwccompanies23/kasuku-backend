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
      throw new ForbiddenException('No user found');
    }

    // ❌ No active subscription
    if (!user.subscriptionActive) {
      throw new ForbiddenException('Upgrade required 🚫');
    }

    return true;
  }
}