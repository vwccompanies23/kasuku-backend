import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Royalty } from '../royalties/royalty.entity';
import { Music } from '../music/music.entity';
import { Release } from '../releases/release.entity';
import { LinkClick } from './link-click.entity'; // 🔥 NEW

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Royalty)
    private royaltyRepo: Repository<Royalty>,

    @InjectRepository(Music)
    private musicRepo: Repository<Music>,

    @InjectRepository(Release)
    private releaseRepo: Repository<Release>,

    @InjectRepository(LinkClick) // 🔥 NEW
    private linkClickRepo: Repository<LinkClick>,
  ) {}

  // =========================
  // 🔥 NEW: TRACK CLICK
  // =========================
  async trackClick(releaseId: number, platform: string) {
    const release = await this.releaseRepo.findOne({
      where: { id: releaseId },
    });

    if (!release) return;

    const click = this.linkClickRepo.create({
      platform,
      release,
    });

    await this.linkClickRepo.save(click);
  }

  // =========================
  // 🔥 NEW: GET CLICKS BY PLATFORM
  // =========================
  async getClicksByPlatform(releaseId: number) {
    return this.linkClickRepo
      .createQueryBuilder('c')
      .select('c.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .where('c.releaseId = :releaseId', { releaseId })
      .groupBy('c.platform')
      .getRawMany();
  }

  // =========================
  // 📊 RELEASE ANALYTICS
  // =========================
  async getReleaseAnalytics(releaseId: number) {
    const release = await this.releaseRepo.findOne({
      where: { id: releaseId },
      relations: ['music'],
    });

    if (!release) {
      throw new NotFoundException('Release not found ❌');
    }

    let totalEarnings = 0;
    let totalPlays = 0;

    const tracks: {
      title: string;
      plays: number;
      earnings: number;
    }[] = [];

    for (const track of release.music) {
      const result = await this.royaltyRepo
        .createQueryBuilder('r')
        .select('SUM(r.amount)', 'total')
        .where('r.musicId = :trackId', { trackId: track.id })
        .getRawOne();

      const earnings = Number(result?.total || 0);

      totalEarnings += earnings;
      totalPlays += track.plays || 0;

      tracks.push({
        title: track.title,
        plays: track.plays || 0,
        earnings,
      });
    }

    // 🔥 NEW: GET CLICKS
    const clicks = await this.getClicksByPlatform(releaseId);

    return {
      releaseId: release.id,
      title: release.title,
      totalPlays,
      totalEarnings,
      tracks,

      // 🔥 NEW DATA
      clicks,
    };
  }
}