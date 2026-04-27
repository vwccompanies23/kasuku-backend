import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch, // ✅ ADD
} from '@nestjs/common';

import { ReferralService } from './referral.service';

@Controller('referrals')
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  // =========================
  // 🎯 APPLY REFERRAL
  // =========================
  @Post('apply')
  apply(@Body() body: any) {
    return this.service.applyReferral(body.userId, body.code);
  }

  // =========================
  // 🔑 GET USER REFERRAL CODE
  // =========================
  @Get('code/:userId')
  getCode(@Param('userId') userId: number) {
    return this.service.assignReferralCode(Number(userId));
  }

  // =========================
  // 📊 GET REFERRAL STATS
  // =========================
  @Get('stats/:userId')
  async getStats(@Param('userId') userId: number) {
    return this.service.getStats(Number(userId));
  }

  // =========================
  // 🔧 ADMIN: TOGGLE USER REFERRALS (🔥 THIS WAS MISSING)
  // =========================
  @Patch('toggle/:userId')
  toggleReferral(
    @Param('userId') userId: number,
    @Body() body: { enabled: boolean },
  ) {
    return this.service.toggleUserReferral(
      Number(userId),
      body.enabled,
    );
  }
}