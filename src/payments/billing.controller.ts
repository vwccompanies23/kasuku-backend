import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Body,
  BadRequestException,
  Headers,
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
    const role = req.user?.role;

    if (!userId) {
      throw new BadRequestException('Invalid user ❌');
    }

    // 🔥 ADMIN BYPASS
    if (role === 'admin') {
      return {
        plan: 'pro',
        price: 0,
        active: true,
        role: 'admin',
        invoices: [],
      };
    }

    const billing = await this.paymentsService.getBilling(userId);

    return {
      ...billing,
      role,
    };
  }

  // =========================
  // 💳 SUBSCRIBE (MAIN ENTRY 🔥)
  // =========================
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Req() req: any, @Body() body: any) {
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌');
    }

    const { plan, billing } = body;

    if (!plan || !billing) {
      throw new BadRequestException('Plan and billing required ❌');
    }

    return this.paymentsService.createCheckout(
      userId,
      plan,
      billing,
    );
  }

  // =========================
  // ❌ CANCEL SUBSCRIPTION
  // =========================
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Req() req: any): Promise<any> {
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌');
    }

    return this.paymentsService.cancel(userId);
  }

  // =========================
  // 💳 GET CARD
  // =========================
  @Get('card')
  @UseGuards(JwtAuthGuard)
  async getCard(@Req() req: any): Promise<any> {
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌');
    }

    return this.paymentsService.getCard(userId);
  }

  // =========================
  // 💳 UPDATE CARD
  // =========================
  @Post('create-setup-intent')
  @UseGuards(JwtAuthGuard)
  async createSetupIntent(@Req() req: any): Promise<any> {
    const userId = Number(req.user?.userId);

    if (!userId) {
      throw new BadRequestException('Invalid user ❌');
    }

    return this.paymentsService.createSetupIntent(userId);
  }

  // =========================
  // 🔥 STRIPE WEBHOOK
  // =========================
  @Post('webhook')
  async webhook(
    @Req() req: any,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.paymentsService.handleWebhook(req, sig);
  }
}