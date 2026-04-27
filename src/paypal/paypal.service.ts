import { Injectable } from '@nestjs/common';
import * as paypal from '@paypal/payouts-sdk';
import { paypalClient } from './paypal.client';

@Injectable()
export class PaypalService {
  async sendPayout(email: string, amount: number) {
    // ✅ FIXED ACCESS
    const request = new (paypal as any).payouts.PayoutsPostRequest();

    request.requestBody({
      sender_batch_header: {
        sender_batch_id: `batch_${Date.now()}`,
        email_subject: 'You received a payout 💸',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: 'USD',
          },
          receiver: email,
          note: 'Payout from Kasuku',
          sender_item_id: `item_${Date.now()}`,
        },
      ],
    });

    const response = await paypalClient.execute(request);

    return response.result;
  }
}