import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Music } from './music.entity';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { User } from '../users/user.entity';

// 🔗 RELATION MODULE
import { ReleasesModule } from '../releases/releases.module';
import { AudioAnalysisService } from './audio-analysis.service';

// ✅ ADD THIS
import { RoyaltiesModule } from '../royalties/royalty.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Music, User]),

    // ✅ KEEP THIS (DO NOT REMOVE)
    forwardRef(() => ReleasesModule),

    // ✅ ADD THIS (FIXES YOUR ERROR)
    RoyaltiesModule,
    AuthModule,
  ],

  controllers: [MusicController],

  providers: [MusicService, AudioAnalysisService],

  // ✅ KEEP THIS
  exports: [MusicService],
})
export class MusicModule {}