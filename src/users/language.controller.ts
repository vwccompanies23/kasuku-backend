import {
  Controller,
  Post,
  Get,
  Req,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('language')
export class LanguageController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // =========================
  // 🌍 SET LANGUAGE
  // =========================
  @Post('set')
  @UseGuards(JwtAuthGuard)
  async setLanguage(
    @Req() req: any,
    @Body() body: { language: string },
  ) {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Unauthorized ❌');
    }

    if (!body?.language) {
      throw new BadRequestException('Language is required ❌');
    }

    const allowedLanguages = [
      'en', // English
      'fr', // French
      'sw', // Kiswahili
      'ln', // Lingala
      'rn', // Kirundi
      'rw', // Kinyarwanda
    ];

    if (!allowedLanguages.includes(body.language)) {
      throw new BadRequestException('Unsupported language ❌');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    // ✅ FIX (prevents crash)
    if (!user) {
      throw new BadRequestException('User not found ❌');
    }

    user.language = body.language;

    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Language updated 🌍',
      language: user.language,
    };
  }

  // =========================
  // 🌍 GET LANGUAGE
  // =========================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyLanguage(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Unauthorized ❌');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found ❌');
    }

    return {
      language: user.language || 'en',
    };
  }
}