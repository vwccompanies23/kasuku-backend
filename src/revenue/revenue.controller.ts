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
import { AdminGuard } from '../auth/admin.guard';

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
@UseGuards(JwtAuthGuard, AdminGuard)
async admin() {
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