import { Controller, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('terms')
export class TermsController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // =========================
  // ✅ ACCEPT TERMS
  // =========================
  @Post('accept')
  @UseGuards(JwtAuthGuard)
  async acceptTerms(@Req() req: any) {
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

    user.acceptedTerms = true;
    user.acceptedDistributionAgreement = true;
    user.acceptedAt = new Date();

    await this.userRepo.save(user);

    return {
      success: true,
      message: 'Terms accepted ✅',
    };
  }

  // =========================
  // 📊 CHECK STATUS
  // =========================
  @Post('status')
  @UseGuards(JwtAuthGuard)
  async checkStatus(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    return {
      acceptedTerms: user?.acceptedTerms || false,
      acceptedDistributionAgreement:
        user?.acceptedDistributionAgreement || false,
      acceptedAt: user?.acceptedAt || null,
    };
  }
}