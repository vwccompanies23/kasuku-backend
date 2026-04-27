import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';

import { User } from '../users/user.entity';
import { Referral } from './referral.entity';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Referral, // ✅ ONLY entities here
    ]),

    SettingsModule, // ✅ CORRECT PLACE
  ],
  providers: [ReferralService],
  controllers: [ReferralController],
  exports: [ReferralService],
})
export class ReferralModule {}