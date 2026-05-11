import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
} from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { cloudinary } from '../config/cloudinary.config';

import { v4 as uuid } from 'uuid';
import { Readable } from 'stream';
import { memoryStorage } from 'multer';

import { MusicService } from '../music/music.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly musicService: MusicService,
  ) {}

  @Post('music')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'file',
          maxCount: 1,
        },
        {
          name: 'cover',
          maxCount: 1,
        },
      ],
      {
        storage: memoryStorage(),
      },
    ),
  )
  async uploadMusic(
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },

    @Body() body: any,
  ) {
    try {
      console.log('🔥 UPLOAD STARTED');

      const file = files.file?.[0];
      const cover = files.cover?.[0];

      if (!file) {
        throw new BadRequestException(
          'File is required ❌',
        );
      }

      console.log(
        '🎵 AUDIO FILE:',
        file.originalname,
      );

      if (cover) {
        console.log(
          '🖼️ COVER FILE:',
          cover.originalname,
        );
      }

      // ======================
      // ☁️ CLOUDINARY STREAM
      // ======================
      const streamUpload = async (
        fileBuffer: Buffer,
        folder: string,
      ): Promise<any> => {
        return new Promise(
          (resolve, reject) => {
            const uploadStream =
              cloudinary.uploader.upload_stream(
                {
                  resource_type: 'auto',
                  folder,
                  public_id: uuid(),
                },

                (
                  error,
                  result,
                ) => {
                  if (error) {
                    console.log(
                      '❌ CLOUDINARY ERROR',
                    );

                    console.log(error);

                    reject(error);
                  } else {
                    console.log(
                      '✅ CLOUDINARY SUCCESS',
                    );

                    resolve(result);
                  }
                },
              );

            const readable =
              new Readable();

            readable.push(
              fileBuffer,
            );

            readable.push(null);

            readable.pipe(
              uploadStream,
            );
          },
        );
      };

      // ======================
      // 🎵 AUDIO UPLOAD
      // ======================
      const audioResult: any =
        await streamUpload(
          file.buffer,
          'music',
        );

      console.log(
        '✅ AUDIO UPLOADED',
      );

      // ======================
      // 🖼️ COVER UPLOAD
      // ======================
      let coverUrl:
        | string
        | null = null;

      if (cover) {
        const allowedImages = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/webp',
        ];

        if (
          !allowedImages.includes(
            cover.mimetype,
          )
        ) {
          throw new BadRequestException(
            'Invalid cover image ❌',
          );
        }

        const coverResult: any =
          await streamUpload(
            cover.buffer,
            'covers',
          );

        coverUrl =
          coverResult.secure_url;

        console.log(
          '✅ COVER UPLOADED',
        );
      }

      // ======================
      // 💾 SAVE MUSIC
      // ======================
      console.log('🔥 BODY:', body);
      console.log('🔥 USER ID:', body.userId);

      const saved =
        await this.musicService.uploadMusic(
          {
            track: {
              buffer:
                file.buffer,

              originalname:
                file.originalname,

              mimetype:
                file.mimetype,
            },

            cover: coverUrl,

            body,

            userId: body.userId,

            cloudinaryUrl:
              audioResult.secure_url,

            public_id:
              audioResult.public_id,
          },
        );

      console.log(
        '✅ MUSIC SAVED',
      );

      // ======================
      // 📤 RESPONSE
      // ======================
      return {
        success: true,

        cloudinary: {
          audio:
            audioResult.secure_url,

          cover: coverUrl,
        },

        music: saved.data,
      };
    } catch (err) {
      console.log(
        '❌ FINAL UPLOAD ERROR',
      );

      console.log(err);

      throw err;
    }
  }
}