import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { User } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PRICE_IDS } from './price-ids';

@Injectable()
export class StripeService {
  public stripe: Stripe;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;

    if (!key) {
      throw new BadRequestException('Stripe key missing ❌');
    }

    this.stripe = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  // =========================
  // 🔐 GET ACCOUNT (NEW)
  // =========================
  async getAccount(accountId: string) {
    return this.stripe.accounts.retrieve(accountId);
  }

  // =========================
  // 🔐 GET ACCOUNT STATUS (NEW)
  // =========================
  async getAccountStatus(accountId: string) {
    const account = await this.getAccount(accountId);

    return {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    };
  }

  // =========================
  // 🆕 CREATE CONNECT ACCOUNT
  // =========================
  async createConnectedAccount() {
    return this.stripe.accounts.create({
      type: 'express',
    });
  }

  // =========================
  // 🆕 ONBOARDING LINK
  // =========================
  async createOnboardingLink(accountId: string) {
    const frontend = process.env.FRONTEND_URL;

    if (!frontend) {
      throw new BadRequestException('Frontend URL missing ❌');
    }

    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontend}/retry`,
      return_url: `${frontend}/dashboard`,
      type: 'account_onboarding',
    });
  }

  // =========================
  // 📊 TOTAL REVENUE
  // =========================
  async getTotalRevenue() {
    const invoices = await this.stripe.invoices.list({
      limit: 100,
    });

    const total = invoices.data.reduce(
      (sum, inv) => sum + (inv.amount_paid || 0),
      0,
    );

    return {
      totalRevenue: total / 100,
      count: invoices.data.length,
    };
  }

  // =========================
  // 🆕 CREATE CUSTOMER
  // =========================
  async createCustomer(email: string) {
    return this.stripe.customers.create({ email });
  }

  // =========================
  // 🔗 STRIPE CONNECT ACCOUNT
  // =========================
  async createConnectAccount(email: string) {
    return this.stripe.accounts.create({
      type: 'express',
      email,
    });
  }

  // =========================
  // 🔗 ONBOARDING LINK
  // =========================
  async createAccountLink(accountId: string) {
    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'http://localhost:3000/reauth',
      return_url: 'http://localhost:3000/success',
      type: 'account_onboarding',
    });
  }

  // =========================
  // 💳 ONE-TIME PAYMENT
  // =========================
  async createCheckoutSession(userId: number, amount: number) {
    const frontend = process.env.FRONTEND_URL;

    if (!frontend) {
      throw new BadRequestException('Frontend URL missing ❌');
    }

    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Account Top-up 💰' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${frontend}/payment-success`,
      cancel_url: `${frontend}/payment-cancel`,
      metadata: {
        userId: String(userId),
        type: 'topup',
      },
    });
  }

  // =========================
  // 🔥 SUBSCRIPTION (PRICE ID)
  // =========================
  async createSubscriptionSession(
    userId: number,
    plan: string,
    billing: 'monthly' | 'yearly',
    artistCount: number,
    region: 'africa' | 'default' = 'default',
  ) {
    const frontend = process.env.FRONTEND_URL;

    if (!frontend) {
      throw new BadRequestException('Frontend URL missing ❌');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    let customerId = user?.stripeCustomerId;

    if (!customerId && user?.email) {
      const customer = await this.createCustomer(user.email);
      customerId = customer.id;

      user.stripeCustomerId = customerId;
      await this.userRepo.save(user);
    }

    const priceId =
      PRICE_IDS[region]?.[plan]?.[billing] ||
      PRICE_IDS.default[plan][billing];

    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontend}/success`,
      cancel_url: `${frontend}/`,
      metadata: {
        userId: String(userId),
        plan,
        billing,
        region,
        artistCount: String(artistCount),
        type: 'subscription',
      },
    });
  }

  // =========================
  // ⚠️ LEGACY (SAFE)
  // =========================
  async createSubscriptionSessionLegacy(
    userId: number,
    plan: string,
    billing: 'monthly' | 'yearly',
    artistCount: number,
  ) {
    const frontend = process.env.FRONTEND_URL;

    if (!frontend) {
      throw new BadRequestException('Frontend URL missing ❌');
    }

    let amount = 0;
    let name = '';

    if (plan === 'solo') {
      amount = billing === 'monthly' ? 175 : 2099;
      name = 'Solo Plan';
    }

    if (plan === 'artists') {
      amount = billing === 'monthly' ? 208 : 2499;
      name = 'Artists Plan';
    }

    if (plan === 'pro') {
      amount =
        billing === 'monthly'
          ? 508
          : artistCount >= 80
          ? 8099
          : 6099;

      name = `Pro Plan (${artistCount} artists)`;
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    let customerId = user?.stripeCustomerId;

    if (!customerId && user?.email) {
      const customer = await this.createCustomer(user.email);
      customerId = customer.id;

      user.stripeCustomerId = customerId;
      await this.userRepo.save(user);
    }

    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name },
            unit_amount: amount,
            recurring: {
              interval: billing === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontend}/success`,
      cancel_url: `${frontend}/`,
      metadata: {
        userId: String(userId),
        plan,
        billing,
        artistCount: String(artistCount),
        type: 'subscription',
      },
    });
  }

  async getPaymentMethods(customerId: string) {
    return this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async createSetupIntent(customerId: string) {
    return this.stripe.setupIntents.create({ customer: customerId });
  }

  async payout(user: User, amount: number) {
    if (!user?.stripeAccountId) {
      throw new BadRequestException('Stripe not connected ❌');
    }

    return this.stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: user.stripeAccountId,
    });
  }

  async transferToConnectedAccount(
    accountId: string,
    amount: number,
    transferGroup?: string,
  ) {
    return this.stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: accountId,
      transfer_group: transferGroup || undefined,
    });
  }

  async getUserByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }
}