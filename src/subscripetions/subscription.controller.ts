import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('admin/subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  // ✅ GET ALL PLANS
  @Get()
  getAll() {
    return this.service.getAll();
  }

  // ✅ UPDATE PRICE
  @Patch(':id')
  update(@Param('id') id: number, @Body() data: any) {
    return this.service.updatePrice(id, data);
  }
}