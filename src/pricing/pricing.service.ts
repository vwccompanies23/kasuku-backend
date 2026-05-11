import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Pricing } from './pricing.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private pricingRepo: Repository<Pricing>,
  ) {}

  // ✅ GET ALL PLANS
  async getPlans() {
    return this.pricingRepo.find({
      where: {
        active: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  // ✅ ADMIN UPDATE PLAN
  async updatePlan(
    id: number,
    data: Partial<Pricing>,
  ) {
    await this.pricingRepo.update(
      id,
      data,
    );

    return this.pricingRepo.findOne({
      where: { id },
    });
  }

  // ✅ CREATE DEFAULT PLANS
  async seedPlans() {
    const count =
      await this.pricingRepo.count();

    if (count > 0) {
      return;
    }

    await this.pricingRepo.save([
      {
        plan: 'solo',
        monthlyPrice: 1.75,
        yearlyPrice: 20.99,
        artistCount: 1,
      },

      {
        plan: 'artists',
        monthlyPrice: 2.08,
        yearlyPrice: 24.99,
        artistCount: 2,
      },

      {
        plan: 'pro',
        monthlyPrice: 5.08,
        yearlyPrice: 60.99,
        artistCount: 5,
      },
    ]);

    console.log(
      '✅ Pricing plans seeded',
    );
  }
}