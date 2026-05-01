import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MusicService } from '../music/music.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly musicService: MusicService) {}

  @Post('music')
  @UseInterceptors(
    FileInterceptor('track', {
      storage: diskStorage({
        destination: './uploads/music',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadMusic(
    @UploadedFile() track: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.musicService.uploadMusic({
      track,
      cover: null, // we’ll add image upload later
      body,
    });
  }
}