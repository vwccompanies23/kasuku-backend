import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import cloudinary from '../config/cloudinary.config';
import { v4 as uuid } from 'uuid';
import { Readable } from 'stream';

// ✅ SERVICE
import { MusicService } from '../music/music.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly musicService: MusicService) {}

  @Post('music')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  async uploadMusic(
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
    @Body() body: any,
  ) {
    const file = files.file?.[0];
    const cover = files.cover?.[0];

    if (!file) {
      throw new BadRequestException('File is required ❌');
    }

    // =========================
    // ☁️ CLOUDINARY UPLOAD FUNC (FIXED 🔥)
    // =========================
    const streamUpload = (fileBuffer: Buffer, folder: string) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            public_id: `${folder}/${uuid()}`, // ✅ dynamic folder
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          },
        );

        const readable = new Readable();
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(stream);
      });
    };

    // =========================
    // 🎵 UPLOAD AUDIO
    // =========================
    const audioResult: any = await streamUpload(file.buffer, 'music');

    // =========================
    // 🖼️ UPLOAD COVER
    // =========================
    let coverUrl: string | null = null;

    if (cover) {
      const allowedImages = ['image/jpeg', 'image/png', 'image/jpg'];

      if (!allowedImages.includes(cover.mimetype)) {
        throw new BadRequestException('Invalid cover image ❌');
      }

      const coverResult: any = await streamUpload(cover.buffer, 'covers'); // ✅ FIXED FOLDER
      coverUrl = coverResult.secure_url;
    }

    // =========================
    // 💾 SAVE TO DATABASE
    // =========================
    const saved = await this.musicService.uploadMusic({
      track: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      cover: coverUrl, // ✅ cloudinary URL
      body,
      cloudinaryUrl: audioResult.secure_url,
      public_id: audioResult.public_id,
    });

    // =========================
    // 📤 RESPONSE
    // =========================
    return {
      success: true,
      cloudinary: {
        audio: audioResult.secure_url,
        cover: coverUrl,
      },
      music: saved.data,
    };
  }
}