import { User } from 'src/users/user.entity';

export function canUseDistributor(
  user: User,
  distributor: string,
): boolean {
  // 🔥 Free & Artists → ONLY internal
  if (user.plan !== 'pro') {
    return distributor === 'internal';
  }

  // 🔥 Pro → can use anything
  return true;
}