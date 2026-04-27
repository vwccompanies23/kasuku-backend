import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // ✅ KEEP

import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

import { Royalty } from '../royalties/royalty.entity';
import { Music } from '../music/music.entity';
import { Release } from '../releases/release.entity';
import { LinkClick } from './link-click.entity'; // 🔥 ADDED

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Royalty,
      Music,
      Release,
      LinkClick, // 🔥 ADDED (THIS FIXES YOUR ERROR)
    ]),

    // ✅ KEEP (DO NOT CHANGE)
    JwtModule.register({
      secret: 'secret',
    }),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}