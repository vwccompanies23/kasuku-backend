import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
  Query,
} from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { MusicService } from './music.service';
import { SubscriptionGuard } from '../common/guards/subscription.guard';

@Controller('music')
export class MusicController {
  constructor(private musicService: MusicService) {}

  // =========================
  // 🎵 GET USER MUSIC (IMPORTANT)
  // =========================
  @Get()
  async getUserMusic(@Query('userId') userId: number) {
    return this.musicService.getUserMusic(userId);
  }

  // =========================
  // 🎵 UPLOAD MUSIC
  // =========================
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cover', maxCount: 1 },
        { name: 'track', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const unique =
              Date.now() + '-' + file.originalname.replace(/\s/g, '');
            cb(null, unique);
          },
        }),

        fileFilter: (req, file, cb) => {
          const ext = file.originalname.toLowerCase();

          // 🎧 AUDIO
          if (file.fieldname === 'track') {
            if (!ext.match(/\.(mp3|wav)$/)) {
              return cb(
                new BadRequestException('Invalid audio file ❌'),
                false,
              );
            }
          }

          // 🖼️ IMAGE
          if (file.fieldname === 'cover') {
            if (!ext.match(/\.(jpg|jpeg|png)$/)) {
              return cb(
                new BadRequestException('Invalid cover image ❌'),
                false,
              );
            }
          }

          cb(null, true);
        },

        limits: {
          fileSize: 100 * 1024 * 1024,
        },
      },
    ),
  )
  async uploadMusic(
    @UploadedFiles()
    files: {
      cover?: Express.Multer.File[];
      track?: Express.Multer.File[];
    },
    @Body() body: any,
  ) {
    const cover = files?.cover?.[0] || null;
    const track = files?.track?.[0] || null;

    if (!track) {
      throw new BadRequestException('Track is required ❌');
    }

    const cleanBody = {
      ...body,
      platforms:
        typeof body.platforms === 'string'
          ? body.platforms
          : JSON.stringify(body.platforms || []),
    };

    return this.musicService.uploadMusic({
      cover,
      track,
      body: cleanBody,
    });
  }

  // =========================
  // 📜 GET ALL MUSIC
  // =========================
  @Get('all')
  async getAll() {
    return this.musicService.getAllMusic();
  }

  // =========================
  // 🗑️ DELETE MUSIC
  // =========================
  @Delete(':id')
  async deleteMusic(@Param('id') id: string) {
    return this.musicService.deleteMusic(Number(id));
  }

  // =========================
  // ▶️ TRACK PLAY (ANALYTICS)
  // =========================
  @Post(':id/play')
  async play(@Param('id') id: string) {
    return this.musicService.incrementPlay(Number(id));
  }

  // =========================
  // 📊 DASHBOARD STATS
  // =========================
  @Get('stats')
  async getStats() {
    return this.musicService.getStats();
  }
}