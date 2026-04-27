import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SplitsService } from './splits.service';
import { Release } from '../releases/release.entity';
import { ReleaseArtist } from '../releases/release-artist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Release,
      ReleaseArtist,
    ]),
  ],
  providers: [SplitsService],
  exports: [SplitsService], // 🔥 IMPORTANT
})
export class SplitsModule {}