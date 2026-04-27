import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getAll() {
    return this.postsService.getAll();
  }

 @Post()
@UseInterceptors(
  FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
  }),
)
async create(
  @Body() body: any,
  @UploadedFile() file: Express.Multer.File,
) {
  try {
    return await this.postsService.create({
      text: body.text,

      // ✅ FIXED HERE (FULL URL)
      image: file
        ? `http://localhost:3000/uploads/${file.filename}`
        : null,
    });
  } catch (err) {
    console.error('POST CREATE ERROR:', err);
    throw err;
  }
}
}