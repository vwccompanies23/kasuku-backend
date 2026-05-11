import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
} from '@nestjs/common';

import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
  ) {}

  // ✅ PUBLIC GET PLANS
  @Get()
  getPlans() {
    return this.pricingService.getPlans();
  }

  // ✅ ADMIN UPDATE PLAN
  @Patch(':id')
  updatePlan(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.pricingService.updatePlan(
      Number(id),
      body,
    );
  }
}