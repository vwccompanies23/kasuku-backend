import { Injectable } from '@nestjs/common';

@Injectable()
export class PaypalService {
  private clientId: string;
  private secret: string;

  setKeys(clientId: string, secret: string) {
    this.clientId = clientId;
    this.secret = secret;
  }

  async payout(user: any, amount: number) {
    return {
      success: true,
      provider: 'paypal',
      amount,
    };
  }
}