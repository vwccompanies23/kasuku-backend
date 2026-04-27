import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  // 🔍 GET CURRENT STATE
  @Get()
  get() {
    return this.service.getSettings();
  }

  // 🔥 ADMIN TOGGLE
  @Patch('referrals')
  toggle(@Body() body: { enabled: boolean }) {
    return this.service.toggleReferrals(body.enabled);
  }
}