import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  ForbiddenException, // ✅ ADD
} from '@nestjs/common';

import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('revenue')
export class RevenueController {
  constructor(private service: RevenueService) {}

  // =========================
  // 💰 ADD REVENUE
  // =========================
  @Post('add')
  async addRevenue(@Body() body: any) {
    return this.service.create(
      body.userId,
      body.amount,
      body.percentage || 40,
      body.musicId, // ✅ ADD THIS (link to song)
    );
  }

  // =========================
  // 📊 ADMIN DASHBOARD (FIXED)
  // =========================
  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async admin(@Req() req: any) {
    // ✅ FIX ROLE CHECK (your JWT uses isAdmin, not role)
    if (!req.user?.isAdmin) {
      throw new ForbiddenException('Admin only ❌');
    }

    // ✅ USE DETAILED STATS (not old one)
    return this.service.getAdminStatsDetailed();
  }

  // =========================
  // 👤 USER VIEW
  // =========================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return this.service.getUserRevenue(req.user.userId);
  }
}