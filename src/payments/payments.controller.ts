import {
  Controller,
  Post,
  Req,
  UseGuards,
  Body,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';

import { StripeService } from './stripe.service';
import { PaymentsService } from './payments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('payments')
export class PaymentsController {
  constructor(
    private stripeService: StripeService,
    private paymentsService: PaymentsService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Get('admin/dashboard')
  async getDashboard() {
    return this.paymentsService.getAdminDashboard();
  }

  @Get('admin/user-profit/:id')
  async getUserProfit(@Param('id') id: string) {
    return this.paymentsService.getUserProfit(Number(id));
  }

  subscriptionActive = false;
  isFreeOverride = true;
  platformFeePercent = 10;
  distributorFeePercent = 10;

  @Post('preview-plan')
  @UseGuards(JwtAuthGuard)
  async previewPlan(
    @Req() req: any,
    @Body() body: {
      plan: string;
      billing: 'monthly' | 'yearly';
      artistCount?: number;
    },
  ) {
    return this.paymentsService.previewPlanChange(req.user.id, body);
  }

  @Post('change-plan')
  @UseGuards(JwtAuthGuard)
  async changePlan(
    @Req() req: any,
    @Body() body: {
      plan: string;
      billing: 'monthly' | 'yearly';
      artistCount?: number;
      noProration?: boolean;
    },
  ) {
    return this.paymentsService.changePlan(req.user.id, body);
  }

  @Post('cancel-later')
  @UseGuards(JwtAuthGuard)
  async cancelLater(@Req() req: any) {
    return this.paymentsService.cancelAtPeriodEnd(req.user.id);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Body() body: any, @Req() req: any) {
    const userId =
  req.user?.userId || req.user?.id;

    const { plan, billing, artistCount } = body;

    if (!plan || !billing) {
      throw new BadRequestException('Missing plan data ❌');
    }

    const region = this.paymentsService.getRegion(req);

    const session =
      await this.stripeService.createSubscriptionSession(
        userId,
        plan,
        billing,
        Number(artistCount || 1),
        region,
      );

    if (!session || !session.url) {
      throw new BadRequestException('Stripe session failed ❌');
    }

    return {
      success: true,
      url: session.url,
    };
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  async connectStripe(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Unauthorized ❌');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found ❌');
    }

    let accountId = user.stripeAccountId;

    if (!accountId) {
      const account =
        await this.stripeService.createConnectAccount(user.email);

      accountId = account.id;

      user.stripeAccountId = accountId;
      await this.userRepo.save(user);
    }

    try {
  const onboarding =
    await this.stripeService.createAccountLink(accountId);

  return {
    success: true,
    url: onboarding.url,
  };
} catch (err) {
  console.log('STRIPE CONNECT ERROR:', err);

  throw new BadRequestException(
    err.message || 'Stripe connect failed ❌',
  );
}
  }

  @Get('stripe/status')
  @UseGuards(JwtAuthGuard)
  async getStripeStatus(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Unauthorized ❌');
    }

    return this.paymentsService.getStripeStatus(userId);
  }

  @Post('checkout')
@UseGuards(JwtAuthGuard)
async checkout(
  @Body() body: any,
  @Req() req: any,
) {
    const userId =
  req.user?.userId || req.user?.id;

    const amount = Number(body?.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount ❌');
    }

    const session =
      await this.stripeService.createCheckoutSession(
        userId,
        amount,
      );

    if (!session || !session.url) {
      throw new BadRequestException('Stripe checkout failed ❌');
    }

    return {
      success: true,
      url: session.url,
    };
  }

  @Post('change-plan-legacy')
  @UseGuards(JwtAuthGuard)
  async changePlanLegacy(
    @Req() req: any,
    @Body() body: {
      plan: string;
      billing: 'monthly' | 'yearly';
      artistCount?: number;
    },
  ) {
    req.user?.userId || req.user?.id
    const userId =
  req.user?.userId || req.user?.id;

return this.paymentsService.changePlan(
  userId,
  body,
);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Unauthorized ❌');
    }

    const amount = Number(body?.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount ❌');
    }

    const result = await this.paymentsService.withdraw(
      userId,
      amount,
    );

    return result;
  }
}