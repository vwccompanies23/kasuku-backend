import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { convertToMp3 } from './audio.converter';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: './uploads/audio',
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + file.originalname;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    const inputPath = file.path;

    // 🔥 convert ANY audio → MP3
    const outputPath = await convertToMp3(inputPath);

    const fileName = path.basename(outputPath);

    return {
      url: `http://localhost:3000/uploads/audio/${fileName}`,
    };
  }
}