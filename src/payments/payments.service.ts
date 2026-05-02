import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Earning } from '../earnings/earning.entity';
import { I18nService } from '../i18n/i18n.service';

import { User } from '../users/user.entity';
import { Transaction } from './transaction.entity';
import { StripeService } from './stripe.service';
import { SplitsService } from './splits.service';
import { Release } from '../releases/release.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { RevenueService } from '../revenue/revenue.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,

    @InjectRepository(Release)
    private releaseRepo: Repository<Release>,

    @InjectRepository(Earning)
    private earningRepo: Repository<Earning>,

    private revenueService: RevenueService,

    private stripeService: StripeService,
    private splitsService: SplitsService,
    private notificationsGateway: NotificationsGateway,
    private i18n: I18nService,
  ) {}

  // =========================
  // 🔐 PRO CHECK (NEW 🔥)
  // =========================
  isProUser(user: User): boolean {
    if (!user) return false;

    // Admin override always wins
    if (user.isFreeOverride) return true;

    return (
      user.subscriptionActive === true &&
      user.subscriptionStatus === 'active'
    );
  }

  // =========================
  // 🔐 ENFORCE ACCESS (NEW 🔥)
  // =========================
  async enforceProAccess(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found ❌');
    }

    const isPro = this.isProUser(user);

    if (!isPro) {
      throw new ForbiddenException('Upgrade to Pro to access this feature 🔒');
    }

    return user;
  }

  // =========================
  // 🔥 HANDLE SUBSCRIPTION
  // =========================
  async handleSubscription(data: any) {
    const user = await this.userRepo.findOne({ where: { email: data.email } });
    if (!user) throw new Error('User not found');

    user.plan = data.plan || 'PRO';
    user.billingCycle = data.billingCycle;
    user.subscriptionStatus = 'active';
    user.subscriptionActive = true;

    user.stripeCustomerId = data.stripeCustomerId;
    user.subscriptionId = data.subscriptionId;

    await this.userRepo.save(user);
  }

  // =========================
  // 💰 DISTRIBUTE EARNINGS
  // =========================
  async distributeEarnings(releaseId: number, amount: number) {
    const release = await this.releaseRepo.findOne({ where: { id: releaseId } });
    if (!release) return;

    const splits = (release as any).splits || [];
    const payouts = await this.splitsService.processSplits(amount, splits);

    for (const p of payouts) {
      const user = await this.userRepo.findOne({ where: { email: p.email } });
      if (!user) continue;

      const safeAmount = Number(p.amount || 0);

      user.balance = Number((Number(user.balance || 0) + safeAmount).toFixed(2));
      await this.userRepo.save(user);

      const month = new Date().toISOString().slice(0, 7);

      await this.earningRepo.save({
        user,
        amount: safeAmount,
        platform: 'distribution',
        month,
        music: undefined,
      });

      this.notificationsGateway.sendToUser(user.id, 'earnings', {
        amount: safeAmount,
      });
    }

    return { success: true };
  }

  // =========================
  // 💰 ADD EARNINGS
  // =========================
 async addEarnings(userId: number, amount: number, musicId?: number) {
  // 🔥 GET USER
  const user = await this.userRepo.findOne({
    where: { id: userId },
  });

  if (!user) return;

  const safeAmount = Number(amount || 0);

  // =========================
  // 💰 UPDATE BALANCE
  // =========================
  user.balance = Number(
    (Number(user.balance || 0) + safeAmount).toFixed(2)
  );

  await this.userRepo.save(user);

  // =========================
  // 📊 SAVE EARNING
  // =========================
  const month = new Date().toISOString().slice(0, 7);

  await this.earningRepo.save({
    user,
    amount: safeAmount,
    platform: 'stream',
    month,
    music: musicId ? { id: musicId } : undefined,
  });

  // =========================
  // 🔥 NEW: REVENUE SHARE SYSTEM
  // =========================
  if (user.isManaged) {
    const percentage = user.revenuePercentage || 40;

    await this.revenueService.create(
      user.id,
      safeAmount,
      percentage,
    );
  }

  return { success: true };
}

  // =========================
  // 🔁 RENEWAL
  // =========================
  async handleRenewal(subscriptionId: string) {
    const user = await this.userRepo.findOne({ where: { subscriptionId } });
    if (!user) return;

    user.subscriptionStatus = 'active';
    user.subscriptionActive = true;

    await this.userRepo.save(user);
  }

  // =========================
  // ❌ FAILED PAYMENT
  // =========================
  async handleFailedPayment(subscriptionId: string) {
    const user = await this.userRepo.findOne({ where: { subscriptionId } });
    if (!user) return;

    user.subscriptionStatus = 'past_due';
    await this.userRepo.save(user);
  }

  // =========================
  // 💀 AUTO CANCEL
  // =========================
  async autoCancel(subscriptionId: string) {
    const user = await this.userRepo.findOne({ where: { subscriptionId } });
    if (!user) return;

    user.subscriptionStatus = 'inactive';
    user.subscriptionActive = false;
    user.plan = 'FREE';

    await this.userRepo.save(user);
  }

  // =========================
  // 🌍 REGION
  // =========================
  getRegion(req: any): 'africa' | 'default' {
    const country = req.headers['cf-ipcountry'] || 'US';
    const africa = ['CD', 'NG', 'KE', 'GH'];

    return africa.includes(country) ? 'africa' : 'default';
  }

  // =========================
  // 💸 WITHDRAW (FIXED 🔥)
  // =========================
  async withdraw(userId: number, amount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    const lang = user?.language || 'en';

    if (!user) {
      throw new BadRequestException(this.i18n.t(lang, 'user_not_found'));
    }

    if (Number(user.balance) < amount) {
      throw new BadRequestException(this.i18n.t(lang, 'insufficient_balance'));
    }

    let finalAmount = amount;

    const isPro = this.isProUser(user);

    // ❗ FIXED: fees only for FREE users
    if (!isPro) {
      const platformCut = (amount * (user.platformFeePercent || 0)) / 100;
      const distributorCut =
        (amount * (user.distributorFeePercent || 0)) / 100;

      await this.txRepo.save({ type: 'platform_fee', amount: platformCut, user } as any);
      await this.txRepo.save({ type: 'distributor_fee', amount: distributorCut, user } as any);
      await this.txRepo.save({ type: 'withdrawal', amount, user } as any);

      finalAmount = amount - platformCut - distributorCut;
    }

    let payout: any = null;

    if (user.stripeAccountId) {
      payout = await this.stripeService.payout(user, finalAmount);
    }

    user.balance = Number((user.balance - amount).toFixed(2));
    await this.userRepo.save(user);

    return {
      success: true,
      message: this.i18n.t(lang, 'withdraw_success'),
      paidToUser: finalAmount,
      payout,
    };
  }

  // =========================
  // 💳 SETUP INTENT
  // =========================
  async createSetupIntent(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripeService.createCustomer(user.email);
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await this.userRepo.save(user);
    }

    const intent = await this.stripeService.createSetupIntent(customerId);

    return { clientSecret: intent.client_secret };
  }

  // =========================
  // 💳 GET CARD
  // =========================
  async getCard(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.stripeCustomerId) return null;

    const methods = await this.stripeService.getPaymentMethods(user.stripeCustomerId);
    const card = methods.data[0];

    if (!card) return null;

    return {
      last4: card.card?.last4,
      exp_month: card.card?.exp_month,
      exp_year: card.card?.exp_year,
    };
  }

  // =========================
  // 📊 ADMIN DASHBOARD
  // =========================
  async getAdminDashboard() {
    const txs = await this.txRepo.find();

    let platform = 0;
    let distributor = 0;
    let withdrawals = 0;

    for (const tx of txs) {
      if (tx.type === 'platform_fee') platform += Number(tx.amount);
      if (tx.type === 'distributor_fee') distributor += Number(tx.amount);
      if (tx.type === 'withdrawal') withdrawals += Number(tx.amount);
    }

    return {
      totalPlatform: platform,
      totalDistributor: distributor,
      totalWithdrawals: withdrawals,
    };
  }

  // =========================
  // 👤 USER PROFIT
  // =========================
  async getUserProfit(userId: number) {
    const txs = await this.txRepo.find({
      where: { user: { id: userId } },
    });

    let total = 0;

    for (const tx of txs) {
      if (tx.type === 'platform_fee') total += Number(tx.amount);
    }

    return { userId, platformEarned: total };
  }

  // =========================
  // 📄 BILLING
  // =========================
  async getBilling(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    return {
      plan: user?.plan || 'FREE',
      price: this.getPlanPrice(user?.plan || 'FREE'),
    };
  }

  private getPlanPrice(plan: string) {
    if (plan === 'solo') return 1.75;
    if (plan === 'artists') return 2.08;
    if (plan === 'pro') return 5.08;
    return 0;
  }

  // =========================
  // 🔄 PLAN MANAGEMENT
  // =========================
  async previewPlanChange(userId: number, data: any) {
    return { success: true, userId, data };
  }

  async changePlan(userId: number, data: any) {
    return { success: true, userId, data };
  }

  async cancelAtPeriodEnd(userId: number) {
    return { success: true, userId };
  }

  async subscribe(userId: number) {
    return { success: true };
  }

  async cancel(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    user.subscriptionStatus = 'inactive';
    user.subscriptionActive = false;
    user.plan = 'FREE';

    await this.userRepo.save(user);

    return { success: true };
  }

  // =========================
  // 📧 EMAIL
  // =========================
  async sendEmail(to: string, subject: string, text: string) {
    console.log(`📧 ${to}: ${subject}`);
  }

 async createCheckout(userId: number, plan: string, billing: string) {
  const user = await this.userRepo.findOne({ where: { id: userId } });

  if (!user) throw new Error('User not found');

  let priceId: string | undefined;

  if (plan === 'solo') {
    priceId =
      billing === 'yearly'
        ? process.env.STRIPE_PRICE_SOLO_YEARLY
        : process.env.STRIPE_PRICE_SOLO_MONTHLY;
  }

  if (plan === 'artists') {
    priceId =
      billing === 'yearly'
        ? process.env.STRIPE_PRICE_ARTISTS_YEARLY
        : process.env.STRIPE_PRICE_ARTISTS_MONTHLY;
  }

  if (plan === 'pro') {
    priceId =
      billing === 'yearly'
        ? process.env.STRIPE_PRICE_PRO_YEARLY
        : process.env.STRIPE_PRICE_PRO_MONTHLY;
  }

  if (!priceId) {
    throw new Error('Invalid plan ❌');
  }

  const session = await this.stripeService.stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,

    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],

    metadata: {
      userId: String(user.id),
      plan,
      billing,
    },

    success_url: 'https://kasukuu.com/success',
    cancel_url: 'https://kasukuu.com/cancel',
  });

  return { url: session.url };
}

async handleWebhook(req: any, sig: string) {
  let event;

  try {
    event = this.stripeService.stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    console.error('❌ Webhook signature failed', err.message);
    throw new Error('Webhook signature invalid');
  }

  // =========================
  // ✅ PAYMENT SUCCESS
  // =========================
  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object;

    const userId = Number(session.metadata?.userId);
    const plan = session.metadata?.plan;
    const billing = session.metadata?.billing;

    if (!userId) return;

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) return;

    // 🔥 ACTIVATE SUBSCRIPTION
    user.subscriptionActive = true;
    user.subscriptionStatus = 'active';
    user.plan = plan?.toUpperCase() || 'PRO';
    user.billingCycle = billing || 'monthly';

    user.stripeCustomerId = session.customer;
    user.subscriptionId = session.subscription;

    await this.userRepo.save(user);

    console.log(`✅ Subscription activated for user ${userId}`);
  }

  // =========================
  // 🔁 RENEWAL SUCCESS
  // =========================
  if (event.type === 'invoice.payment_succeeded') {
    const invoice: any = event.data.object;

    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    await this.handleRenewal(subscriptionId);

    console.log('🔁 Subscription renewed');
  }

  // =========================
  // ❌ PAYMENT FAILED
  // =========================
  if (event.type === 'invoice.payment_failed') {
    const invoice: any = event.data.object;

    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    await this.handleFailedPayment(subscriptionId);

    console.log('❌ Payment failed');
  }

  // =========================
  // 💀 SUBSCRIPTION CANCELED
  // =========================
  if (event.type === 'customer.subscription.deleted') {
    const sub: any = event.data.object;

    const subscriptionId = sub.id;

    if (!subscriptionId) return;

    await this.autoCancel(subscriptionId);

    console.log('💀 Subscription canceled');
  }

  return { received: true };
}

  // =========================
  // 🔐 STRIPE STATUS
  // =========================
  async getStripeStatus(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user?.stripeAccountId) {
      return { connected: false };
    }

    const account = await this.stripeService.stripe.accounts.retrieve(
      user.stripeAccountId,
    );

    return {
      connected: true,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
    };
  }
}