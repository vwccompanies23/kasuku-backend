import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Release } from '../releases/release.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReleaseAudienceListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly gateway: NotificationsGateway,

    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // =========================
  // 🎧 LISTEN: RELEASE LIVE (AUDIENCE)
  // =========================
  @OnEvent('release.live')
  async notifyAudience(payload: {
    releaseId: number;
    title: string;
    artist: string;
    userId: number;
  }) {
    const { releaseId, title, artist, userId } = payload;

    const message = `🔥 "${title}" by ${artist} is now live!`;

    // =========================
    // 1️⃣ GET RELEASE + SPLITS (COLLABORATORS)
    // =========================
    const release = await this.releaseRepo.findOne({
      where: { id: releaseId },
    });

    const splits = (release as any)?.splits || [];

    // =========================
    // 2️⃣ NOTIFY COLLABORATORS
    // =========================
    for (const split of splits) {
      const user = await this.userRepo.findOne({
        where: { email: split.email },
      });

      if (!user) continue;

      await this.notificationsService.create(user.id, message);

      this.gateway.sendToUser(user.id, 'release_live', {
        message,
      });

      if (user.email) {
        await this.notificationsService.sendEmail(
          user.email,
          '🎵 Release is Live!',
          `"${title}" you collaborated on is now live 🚀`,
        );
      }
    }

    // =========================
    // 3️⃣ NOTIFY FOLLOWERS (OPTIONAL STRUCTURE)
    // =========================
    // If you later add followers:
    // user.followers = [userId1, userId2...]

    const owner = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['followers'], // only if exists
    });

    const followers = (owner as any)?.followers || [];

    for (const follower of followers) {
      await this.notificationsService.create(
        follower.id,
        message,
      );

      this.gateway.sendToUser(follower.id, 'release_live', {
        message,
      });

      if (follower.email) {
        await this.notificationsService.sendEmail(
          follower.email,
          '🔥 New Release Dropped',
          `${artist} just dropped "${title}" 🎶`,
        );
      }
    }
  }
}