import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { RoyaltyService } from './royalty.service';

// (optional if you already use auth)
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('royalties')
export class RoyaltyController {
  constructor(private royaltyService: RoyaltyService) {}

  // =========================
  // 💰 TOTAL EARNINGS
  // =========================
  @Get('total')
  @UseGuards(JwtAuthGuard)
  async getTotal(@GetUser() user: any) {
    const userId = Number(user?.userId);

    return this.royaltyService.getTotalEarnings(userId);
  }

  // =========================
  // 📊 MONTHLY EARNINGS
  // =========================
  @Get('monthly')
  @UseGuards(JwtAuthGuard)
  async getMonthly(@GetUser() user: any) {
    const userId = Number(user?.userId);

    return this.royaltyService.getMonthlyEarnings(userId);
  }

  // =========================
  // 🎵 REVENUE BY SOURCE
  // =========================
  @Get('sources')
  @UseGuards(JwtAuthGuard)
  async getSources(@GetUser() user: any) {
    const userId = Number(user?.userId);

    return this.royaltyService.getEarningsBySource(userId);
  }

  // =========================
  // 📜 RECENT TRANSACTIONS
  // =========================
  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecent(@GetUser() user: any) {
    const userId = Number(user?.userId);

    return this.royaltyService.getRecent(userId);
  }
}