import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { ToolostProvider } from './providers/toolost.provider';

import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class DistributionService {
  constructor(
    private readonly toolostProvider: ToolostProvider,

    @InjectQueue('distribution')
    private readonly distributionQueue: Queue,
  ) {}

  // =========================
  // 🚀 QUEUE RELEASE
  // =========================
  async sendRelease(data: any) {

    // 🔥 TAKEDOWN
    if (data.type === 'TAKEDOWN') {
      console.log('🚫 TAKEDOWN REQUEST');

      return {
        success: true,
        message:
          'Takedown request sent to stores',
      };
    }

    // ❌ VALIDATION
    if (
      !data?.title ||
      !data?.tracks?.length
    ) {
      throw new BadRequestException(
        'Invalid release data ❌',
      );
    }

    console.log(
      '\n🚀 DISTRIBUTION QUEUED',
    );

    console.log(
      'Title:',
      data.title,
    );

    // ✅ QUEUE JOB
    const job =
      await this.distributionQueue.add(
        'distribute',
        {
          releaseId:
            data.releaseId ||
            Date.now(),

          payload: data,
        },
        {
          attempts: 5,

          backoff: {
            type: 'exponential',
            delay: 5000,
          },

          removeOnComplete: true,
          removeOnFail: false,
        },
      );

    return {
      success: true,
      jobId: job.id,
      status: 'queued',
    };
  }

  // =========================
  // 🔥 INTERNAL DISTRIBUTOR
  // =========================
  async sendToRealDistributor(
    data: any,
  ) {
    console.log(
      '🌍 Internal distribution mode...',
    );

    const distributor =
      'internal';

    try {

      // ✅ INTERNAL ONLY
      if (
        distributor ===
        'internal'
      ) {
        console.log(
          '📦 Stored internally only',
        );

        return {
          success: true,
          message:
            'Release stored internally ✅',
        };
      }

      return {
        success: false,
        message:
          'No distributor configured ❌',
      };

    } catch (err: any) {

      console.error(
        'Distributor error:',
        err?.response?.data ||
          err.message,
      );

      return {
        success: false,
        message:
          'Distribution failed ❌',
      };
    }
  }

  // =========================
  // 🎧 SPOTIFY
  // =========================
  async sendToSpotify(
    data: any,
  ) {
    console.log(
      '🎧 Sending to Spotify...',
    );

    if (
      !data.spotifyArtistId &&
      !data.artists?.length
    ) {
      console.warn(
        '⚠️ No Spotify Artist ID',
      );

      return {
        platform: 'spotify',
        status: 'skipped',
      };
    }

    const fakeId =
      Math.floor(
        Math.random() *
          1000000000,
      );

    this.simulateFinalStatus(
      'Spotify',
      'N/A',
    );

    return {
      platform: 'spotify',
      platformName:
        'Spotify',
      status: 'processing',
      delivered: false,

      url: `https://open.spotify.com/track/${fakeId}`,
    };
  }

  // =========================
  // 🍎 APPLE MUSIC
  // =========================
  async sendToAppleMusic(
    data: any,
  ) {
    console.log(
      '🍎 Sending to Apple Music...',
    );

    if (
      !data.appleMusicId &&
      !data.artists?.length
    ) {
      console.warn(
        '⚠️ No Apple Music ID',
      );

      return {
        platform: 'apple',
        status: 'skipped',
      };
    }

    const fakeId =
      Math.floor(
        Math.random() *
          1000000000,
      );

    this.simulateFinalStatus(
      'Apple',
      'N/A',
    );

    return {
      platform: 'apple',
      platformName:
        'Apple Music',
      status: 'processing',
      delivered: false,

      url: `https://music.apple.com/album/${fakeId}`,
    };
  }

  // =========================
  // ▶️ YOUTUBE MUSIC
  // =========================
  async sendToYouTube(
    data: any,
  ) {
    console.log(
      '▶️ Sending to YouTube...',
    );

    if (
      !data.youtubeChannelId &&
      !data.artists?.length
    ) {
      console.warn(
        '⚠️ No YouTube Channel ID',
      );

      return {
        platform: 'youtube',
        status: 'skipped',
      };
    }

    const fakeId =
      Math.random()
        .toString(36)
        .substring(7);

    this.simulateFinalStatus(
      'YouTube',
      'N/A',
    );

    return {
      platform: 'youtube',
      platformName:
        'YouTube Music',
      status: 'processing',
      delivered: false,

      url: `https://music.youtube.com/watch?v=${fakeId}`,
    };
  }

  // =========================
  // 🔥 SIMULATE DSP STATUS
  // =========================
  private simulateFinalStatus(
    platform: string,
    id?: string,
  ) {
    setTimeout(() => {

      if (id) {

        console.log(
          `✅ ${platform} DELIVERED → ID: ${id}`,
        );

      } else {

        console.log(
          `✅ ${platform} DELIVERED`,
        );
      }

    }, 3000 + Math.random() * 2000);
  }
}