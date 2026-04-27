import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ReleaseEvents {
  constructor(
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  // =========================
  // 🎵 RELEASE LIVE EVENT
  // =========================
  @OnEvent('release.live')
  async handleReleaseLive(payload: {
    userId: number;
    email: string;
    title: string;
  }) {
    const { userId, email, title } = payload;

    // ✅ Save notification
    await this.notificationsService.create(
      userId,
      `🎵 "${title}" is now LIVE!`,
    );

    // ✅ Realtime
    this.notificationsGateway.sendToUser(userId, 'release_live', {
      title,
      message: `🎵 ${title} is live`,
    });

    // ✅ Email
    await this.notificationsService.sendEmail(
      email,
      '🎵 Your Release is LIVE!',
      `"${title}" is now available 🚀`,
    );
  }
}