import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService implements OnModuleInit {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any
  });

  constructor(
    @InjectRepository(Subscription)
    private repo: Repository<Subscription>,
  ) {}

  // ✅ AUTO SEED (FIXES YOUR EMPTY PAGE ISSUE)
  async onModuleInit() {
    const count = await this.repo.count();

    if (count === 0) {
      await this.repo.save([
        {
          name: 'Solo Artist',
          monthlyPrice: 1.75,
          yearlyPrice: 19.99,
        },
        {
          name: 'Artists',
          monthlyPrice: 2.08,
          yearlyPrice: 24.99,
        },
        {
          name: 'Pro',
          monthlyPrice: 5.08,
          yearlyPrice: 59.99,
        },
      ]);

      console.log('🔥 Subscription plans seeded');
    }
  }

  // ✅ GET ALL PLANS
  async getAll() {
    return this.repo.find();
  }

  // ✅ UPDATE PRICE (STRIPE + DB)
  async updatePrice(id: number, data: any) {
    const plan = await this.repo.findOne({ where: { id } });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // 🔥 CREATE PRODUCT IF MISSING
if (!plan.stripeProductId) {
  const product = await this.stripe.products.create({
    name: plan.name,
  });

  plan.stripeProductId = product.id;
}

    // 🔥 CREATE NEW STRIPE MONTHLY PRICE
    const monthlyPrice = await this.stripe.prices.create({
      unit_amount: Math.round(data.monthlyPrice * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product: plan.stripeProductId,
    });

    // 🔥 OPTIONAL: CREATE YEARLY PRICE TOO
    let yearlyPriceId = plan.stripeYearlyPriceId;

    if (data.yearlyPrice) {
      const yearlyPrice = await this.stripe.prices.create({
        unit_amount: Math.round(data.yearlyPrice * 100),
        currency: 'usd',
        recurring: { interval: 'year' },
        product: plan.stripeProductId,
      });

      yearlyPriceId = yearlyPrice.id;
    }

    // ✅ UPDATE DB
    plan.monthlyPrice = data.monthlyPrice;
    plan.yearlyPrice = data.yearlyPrice ?? plan.yearlyPrice;
    plan.stripePriceId = monthlyPrice.id;
    plan.stripeYearlyPriceId = yearlyPriceId;

    return this.repo.save(plan);
  }
}