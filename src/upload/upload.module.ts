import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MusicModule } from '../music/music.module'; // ✅ ADD THIS

@Module({
  imports: [
    MusicModule, // ✅ THIS FIXES EVERYTHING
  ],
  controllers: [UploadController],
})
export class UploadModule {}