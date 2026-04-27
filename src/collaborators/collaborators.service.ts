import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Release } from '../releases/release.entity';
import { User } from '../users/user.entity';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectRepository(Release)
    private releaseRepo: Repository<Release>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private paymentsService: PaymentsService,
  ) {}

  // =========================
  // ➕ ADD COLLABORATOR
  // =========================
  async addCollaborator(
    ownerId: number,
    email: string,
    percent: number,
  ) {
    if (!email || !percent) {
      throw new BadRequestException('Missing data ❌');
    }

    const release = await this.releaseRepo.findOne({
      where: { user: { id: ownerId } as any },
      relations: ['user'],
    });

    if (!release) {
      throw new BadRequestException('Release not found ❌');
    }

    // 🔥 ensure splits exists
    const splits: any[] = (release as any).splits || [];

    const total = splits.reduce((sum, s) => sum + Number(s.percent), 0);

    if (total + percent > 100) {
      throw new BadRequestException('Split exceeds 100% ❌');
    }

    const newSplit = {
      email,
      percent,
    };

    splits.push(newSplit);

    (release as any).splits = splits;

    await this.releaseRepo.save(release);

    // =========================
    // 📧 SEND EMAIL INVITE
    // =========================
    await this.paymentsService.sendEmail(
      email,
      '🎶 Kasuku Collaboration Invite',
      `
You’ve been added as a collaborator on Kasuku.

🎵 Release: ${release.title}
💰 Your split: ${percent}%

Login to view:
${process.env.FRONTEND_URL}/collaborators
      `,
    );

    return { success: true };
  }

  // =========================
  // ❌ REMOVE COLLABORATOR
  // =========================
  async removeCollaborator(ownerId: number, email: string) {
    const release = await this.releaseRepo.findOne({
      where: { user: { id: ownerId } as any },
    });

    if (!release) {
      throw new BadRequestException('Release not found ❌');
    }

    const splits: any[] = (release as any).splits || [];

    (release as any).splits = splits.filter(
      (s) => s.email !== email,
    );

    await this.releaseRepo.save(release);

    return { success: true };
  }
}