import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ReleaseLiveListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  @OnEvent('release.live')
  async handleReleaseLive(payload: {
    releaseId: number;
    title: string;
    artist: string;
    userId: number;
    email?: string; // ✅ FIXED
  }) {
    const { userId, title, artist } = payload;

    const message = `🎵 "${title}" by ${artist} is now LIVE 🚀`;

    // 🔔 SAVE IN DB
    await this.notificationsService.create(userId, message);

    // ⚡ REALTIME
    this.gateway.sendToUser(userId, 'release_live', {
      title,
      message,
    });

    // 📧 EMAIL (SAFE)
    if (payload?.email) {
      await this.notificationsService.sendEmail(
        payload.email,
        '🎵 Your Release is Live!',
        `"${title}" is now live on streaming platforms 🚀`,
      );
    }
  }
}