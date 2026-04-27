import { Controller, Post, Body } from '@nestjs/common';
import Stripe from 'stripe';

@Controller('payments')
export class CheckoutController {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any
  });

  @Post('create-checkout')
  async createCheckout(@Body() body: any) {
    const { priceId } = body;

    if (!priceId) {
      throw new Error('Missing priceId');
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan: body.billingCycle,
        billingCycle: body.billingCycle,
      },
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
    });

    return { url: session.url };
  }
}