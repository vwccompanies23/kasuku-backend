import {
  Controller,
  Get,
  Post, // 🔥 NEW
  Body, // 🔥 NEW
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  // =========================
  // 🔐 PRIVATE (DASHBOARD)
  // =========================
  @Get('release/:id')
  @UseGuards(JwtAuthGuard)
  async getReleaseAnalytics(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const userId = Number(user?.userId);

    if (!userId) {
      throw new UnauthorizedException('Invalid user ❌');
    }

    return this.analyticsService.getReleaseAnalytics(
      Number(id),
    );
  }

  // =========================
  // 🌍 PUBLIC (NO LOGIN)
  // =========================
  @Get('public/release/:id')
  async getPublicReleaseAnalytics(
    @Param('id') id: string,
  ) {
    return this.analyticsService.getReleaseAnalytics(
      Number(id),
    );
  }

  // =========================
  // 🔥 NEW: TRACK CLICK
  // =========================
  @Post('click')
  async trackClick(
    @Body()
    body: {
      releaseId: number;
      platform: string;
    },
  ) {
    if (!body?.releaseId || !body?.platform) {
      throw new UnauthorizedException('Invalid data ❌');
    }

    await this.analyticsService.trackClick(
      Number(body.releaseId),
      body.platform,
    );

    return { success: true };
  }
}