import { Injectable } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';

@Injectable()
export class PaymentManager {
  constructor(
    private readonly stripe: StripeService,
    private readonly paypal: PaypalService,
  ) {}

  async payout(provider: string, user: any, amount: number) {
    switch (provider) {
      case 'stripe':
        return this.stripe.payout(user, amount);

      case 'paypal':
        return this.paypal.payout(user, amount);

      default:
        throw new Error('Unsupported payment provider ❌');
    }
  }
}