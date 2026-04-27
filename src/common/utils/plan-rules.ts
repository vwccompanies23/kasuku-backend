export class PlanRules {
  static canUploadRelease(user: any): boolean {
    return user.subscriptionStatus === 'active';
  }

  static canUseDistributor(user: any, distributor: string): boolean {
    // Only PRO can use external distributors
    if (distributor !== 'internal') {
      return user.plan === 'pro';
    }

    return true;
  }

  static canUseCustomLabel(user: any): boolean {
    return ['artists', 'pro'].includes(user.plan);
  }

  static getAllowedDistributor(user: any, requested: string): string {
    if (user.plan === 'pro') {
      return requested || 'toolost';
    }

    return 'internal';
  }
}