import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Release } from './release.entity';
import { ReleaseArtist } from './release-artist.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';

// 🔥 ADD THIS
import { User } from '../users/user.entity';
import { CodesService } from './codes.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { BullModule } from '@nestjs/bull';

// 🔥 OPTIONAL (ONLY if you use these services)
import { MusicModule } from '../music/music.module';
import { SplitsModule } from '../payments/splits.module';
import { DistributionModule } from '../distributions/distribution.module';
import { ArtistModule } from '../artists/artist.module';
import { EmailService } from '../email/email.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Release,
      ReleaseArtist,
      User,
    ]),

    EmailModule,
    
    MusicModule,
    SplitsModule,
    DistributionModule,
    JwtModule,
    UsersModule,
    ArtistModule,

    BullModule.registerQueue({
  name: 'distribution',
}),

  ],
  providers: [
    ReleasesService,
    CodesService, // ✅ HERE
  ],
  controllers: [ReleasesController],
  exports: [ReleasesService],
})
export class ReleasesModule {}