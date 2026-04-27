import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from './settings.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly repo: Repository<Settings>,
  ) {}

  // ✅ GET SETTINGS (AUTO CREATE IF NONE)
  async getSettings() {
    let settings = await this.repo.findOne({ where: {} });

    if (!settings) {
      settings = this.repo.create({
        referralsEnabled: true, // default ON
      });
      await this.repo.save(settings);
    }

    return settings;
  }

  // ✅ TOGGLE REFERRALS
  async toggleReferrals(enabled: boolean) {
    const settings = await this.getSettings();

    settings.referralsEnabled = enabled;

    await this.repo.save(settings);

    return settings;
  }
}