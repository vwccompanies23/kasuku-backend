import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Pricing } from './pricing.entity';

import { PricingService } from './pricing.service';

import { PricingController } from './pricing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pricing,
    ]),
  ],

  providers: [PricingService],

  controllers: [PricingController],

  exports: [PricingService],
})
export class PricingModule {}