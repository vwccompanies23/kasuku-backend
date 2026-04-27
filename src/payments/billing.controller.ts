import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  BadRequestException, // ✅ ADDED
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  // =========================
// 🔐 GET MY BILLING INFO
// =========================
@Get('me')
@UseGuards(JwtAuthGuard)
async getMyBilling(@Req() req: any): Promise<any> {
  const userId = Number(req.user?.userId);
  const role = req.user?.role; // 🔥 ADD THIS

  if (!userId) {
    throw new BadRequestException('Invalid user ❌');
  }

  // 🔥 ADMIN BYPASS (MAIN FEATURE)
  if (role === 'admin') {
    return {
      plan: 'pro',
      price: 0,
      active: true,
      role: 'admin',
      invoices: [],
    };
  }

  // ✅ NORMAL USERS
  const billing = await this.paymentsService.getBilling(userId);

  return {
    ...billing,
    role, // 🔥 include role for frontend
  };
}

  // =========================
  // 💳 SUBSCRIBE
  // =========================
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Req() req: any): Promise<any> { // ✅ TYPE ADDED
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌'); // ✅ ADDED
    }

    return this.paymentsService.subscribe(userId);
  }

  // =========================
  // ❌ CANCEL SUBSCRIPTION
  // =========================
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Req() req: any): Promise<any> { // ✅ TYPE ADDED
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌'); // ✅ ADDED
    }

    return this.paymentsService.cancel(userId);
  }

  // =========================
  // 💳 GET CARD
  // =========================
  @Get('card')
  @UseGuards(JwtAuthGuard)
  async getCard(@Req() req: any): Promise<any> { // ✅ TYPE ADDED
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌'); // ✅ ADDED
    }

    return this.paymentsService.getCard(userId);
  }

  // =========================
  // 💳 UPDATE CARD
  // =========================
  @Post('create-setup-intent')
  @UseGuards(JwtAuthGuard)
  async createSetupIntent(@Req() req: any): Promise<any> { // ✅ TYPE ADDED
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌'); // ✅ ADDED
    }

    return this.paymentsService.createSetupIntent(userId);
  }
}