import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentSettings } from './payment-settings.entity';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('payment-settings')
export class PaymentSettingsController {
  constructor(
    @InjectRepository(PaymentSettings)
    private settingsRepo: Repository<PaymentSettings>,
  ) {}

  // =========================
  // 📥 GET SETTINGS (PUBLIC)
  // =========================
  @Get()
  async getSettings() {
    let settings = await this.settingsRepo.findOne({
      where: {},
    });

    // 🔥 AUTO CREATE IF EMPTY
    if (!settings) {
      settings = await this.settingsRepo.save({});
    }

    return settings;
  }

  // =========================
  // 💰 UPDATE SETTINGS (ADMIN)
  // =========================
  @Post('update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateSettings(@Body() body: any) {
    let settings = await this.settingsRepo.findOne({
      where: {},
    });

    if (!settings) {
      settings = await this.settingsRepo.save({});
    }

    // 🔥 UPDATE VALUES
    Object.assign(settings, body);

    await this.settingsRepo.save(settings);

    return {
      success: true,
      message: 'Settings updated 🚀',
      data: settings,
    };
  }
}