import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

// ✅ DTO (prevents this issue forever)
class WithdrawDto {
  amount: number;
  method: 'stripe' | 'paypal';
  email?: string;
}

@Controller('payouts')
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
  ) {}

  // =========================
  // 💰 REQUEST PAYOUT
  // =========================
  @Post('request')
  @UseGuards(JwtAuthGuard)
  request(
    @GetUser() user: any,
    @Body() body: WithdrawDto,
  ) {
    return this.payoutsService.requestWithdraw(
      user.userId,
      body.amount,
      body.method,
      body.email,
    );
  }

  // =========================
  // 🚀 WITHDRAW (same logic)
  // =========================
  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(
    @GetUser() user: any,
    @Body() body: WithdrawDto,
  ) {
    const payout = await this.payoutsService.requestWithdraw(
      user.userId,
      body.amount,
      body.method,
      body.email,
    );

    return {
      message: 'Payout queued',
      payoutId: payout.id,
    };
  }

  // =========================
  // 📜 HISTORY
  // =========================
  @Get('history')
  @UseGuards(JwtAuthGuard)
  history(@GetUser() user: any) {
    return this.payoutsService.getHistory(user.userId);
  }

  // =========================
  // 💰 WALLET
  // =========================
  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  wallet(@GetUser() user: any) {
    return this.payoutsService.getWallet(user.userId);
  }

  // =========================
  // 🏦 APPROVE (ADMIN)
  // =========================
  @Post('approve/:id')
  approve(@Param('id') id: string) {
    return this.payoutsService.approvePayout(Number(id));
  }

  // =========================
  // ❌ REJECT
  // =========================
  @Post('reject/:id')
  reject(@Param('id') id: string) {
    return this.payoutsService.rejectPayout(Number(id));
  }
}