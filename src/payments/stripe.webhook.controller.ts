import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('payments/webhook/stripe')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;

    if (!key) {
      throw new Error('❌ STRIPE_SECRET_KEY is missing');
    }

    this.stripe = new Stripe(key, {
      apiVersion: '2023-10-16' as any // ✅ FIXED (stable)
    });
  }

  @Post()
  async handleWebhook(
    @Req() req: Request & { rawBody: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

      if (!webhookSecret) {
        throw new Error('❌ STRIPE_WEBHOOK_SECRET missing');
      }

      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      console.error('❌ Signature error:', err.message);
      throw new BadRequestException('Invalid signature');
    }

    console.log('🔥 EVENT:', event.type);

    switch (event.type) {

      // =========================
      // ✅ SUBSCRIPTION CREATED
      // =========================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const email =
          session.customer_details?.email ||
          session.customer_email ||
          '';

        await this.paymentsService.handleSubscription({
          email,
          plan: session.metadata?.plan || 'free',
          billingCycle:
            session.metadata?.billingCycle === 'yearly'
              ? 'yearly'
              : 'monthly',
          stripeCustomerId: session.customer as string,
          subscriptionId: session.subscription as string,
        });

        console.log('✅ Subscription activated');
        break;
      }

      // =========================
      // 🔁 RENEW SUCCESS
      // =========================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        const subscriptionId = (invoice as any).subscription as string;

        await this.paymentsService.handleRenewal(subscriptionId);

        const email = invoice.customer_email;

        if (email) {
          await this.notificationsService.sendEmail(
            email,
            'Subscription Renewed',
            'Your subscription renewed successfully ✅',
          );
        }

        console.log('🔁 Renewal success');
        break;
      }

      // =========================
      // ❌ PAYMENT FAILED
      // =========================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        const subscriptionId = (invoice as any).subscription as string;

        await this.paymentsService.handleFailedPayment(subscriptionId);

        const email = invoice.customer_email;

        if (email) {
          await this.notificationsService.sendEmail(
            email,
            'Payment Failed',
            'Update your card to avoid cancellation ⚠️',
          );
        }

        console.log('❌ Payment failed');
        break;
      }

      // =========================
      // 💀 AUTO CANCEL
      // =========================
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        await this.paymentsService.autoCancel(sub.id);

        console.log('💀 Subscription cancelled');
        break;
      }

      // =========================
      // 💰 EARNINGS DISTRIBUTION
      // =========================
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;

        const releaseId = Number(pi.metadata?.releaseId);
        const amount = (pi.amount_received || 0) / 100;

        if (releaseId) {
          await this.paymentsService.distributeEarnings(
            releaseId,
            amount,
          );

          console.log('💰 Earnings distributed');
        }

        break;
      }

      // =========================
      // 🔒 SUBSCRIPTION UPDATED
      // =========================
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;

        if (sub.status === 'active') {
          await this.paymentsService.handleRenewal(sub.id);
        }

        if (sub.status === 'past_due') {
          await this.paymentsService.handleFailedPayment(sub.id);
        }

        console.log('🔄 Subscription updated:', sub.status);
        break;
      }

      default:
        console.log('ℹ️ Unhandled:', event.type);
    }

    return { received: true };
  }
}