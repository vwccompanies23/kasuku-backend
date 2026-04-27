import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

import { Release, ReleaseType } from './release.entity';
import { User } from '../users/user.entity';

import { DistributionService } from '../distributions/distribution.service';
import { MusicService } from '../music/music.service';
import { SplitsService } from '../payments/splits.service';
import { CodesService } from './codes.service';
import { ArtistService } from '../artists/artist.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(Release)
    private readonly releaseRepo: Repository<Release>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly artistService: ArtistService,
    private readonly distributionService: DistributionService,
    private readonly musicService: MusicService,
    private readonly splitsService: SplitsService,
    private readonly codesService: CodesService,
    private readonly emailService: EmailService,

    @InjectQueue('distribution')
    private readonly distributionQueue: Queue,
  ) {}

  // =========================
  // 🔥 CREATE RELEASE
  // =========================
  async createRelease(data: any) {
    const user = await this.userRepo.findOne({
      where: { id: data.userId },
    });

    if (!user) throw new BadRequestException('User not found');

    const artist = await this.artistService.findOrCreate({
      name: data.artistName,
      isFirstRelease: data.isFirstRelease,
      spotifyId: data.spotifyId,
      appleMusicId: data.appleMusicId,
      youtubeChannelId: data.youtubeChannelId,
    });

    const release = this.releaseRepo.create({
      title: data.title,
      artistName: artist.name,
      user: { id: data.userId } as any,
      upc: this.codesService.generateUPC(),
      distributor: user.plan === 'pro' ? 'toolost' : 'internal',
      approvalStatus: 'pending',
    });

    return this.releaseRepo.save(release);
  }

  // =========================
  // 🔥 FULL RELEASE
  // =========================
  async createFullRelease(data: {
  body: any;
  cover?: Express.Multer.File;
  tracks: Express.Multer.File[];
  trackTitles: string[];
  userId: number;
}) {
  const { body, cover, tracks, trackTitles, userId } = data;

  if (!tracks || !tracks.length) {
    throw new BadRequestException('No tracks uploaded ❌');
  }

  const user = await this.userRepo.findOne({
    where: { id: userId },
  });

  if (!user) throw new BadRequestException('User not found');

  const artist = await this.artistService.findOrCreate({
    name: body.artistName,
    isFirstRelease: body.isFirstRelease,
  });

  // ✅ USE USER INPUT (fallback if empty)
  const upc = body.upc || this.codesService.generateUPC();

  const release = this.releaseRepo.create({
    title: body.title,
    artistName: artist.name,
    user: { id: userId } as any,
    upc,
    distributor: user.plan === 'pro' ? 'toolost' : 'internal',
    status: 'draft',

    // ✅ ADD THESE BACK (YOU LOST THEM)
    releaseDate: body.date ? new Date(body.date) : undefined,
    originalReleaseDate: body.originalDate
        ? new Date(body.originalDate)
         : undefined,
  });

  const saved = await this.releaseRepo.save(release as any) as Release;

  // =========================
  // TRACKS
  // =========================
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const title = trackTitles?.[i] || `Track ${i + 1}`;

    const isrc =
      body.isrc && tracks.length === 1
        ? body.isrc // ✅ SINGLE TRACK USE USER ISRC
        : this.codesService.generateISRC();

    await this.musicService.uploadMusic({
      cover,
      track,
      body: {
        title,
        userId,
        releaseId: saved.id,
        isrc,
      },
    });
  }

  return this.findOne(saved.id);
}

  // =========================
// 🔍 FIND BY DISTRIBUTION ID
// =========================
async findByDistributionId(distributionId: string) {
  return this.releaseRepo.findOne({
    where: { distributionId },
    relations: ['user'], // 🔥 IMPORTANT (we need userId)
  });
}

  // =========================
  // 🚀 SUBMIT FOR DISTRIBUTION (FIXED)
  // =========================
  async submitForDistribution(
    releaseId: number,
    userId?: number,
  ) {
    const release = await this.releaseRepo.findOne({
      where: { id: releaseId },
      relations: ['music', 'releaseArtists', 'releaseArtists.artist'],
    });

    if (!release) throw new BadRequestException('Release not found');

    let artists = release.releaseArtists || [];

    if (!artists.length && release.artistName) {
      const fallbackArtist = await this.artistService.findOrCreate({
        name: release.artistName,
        isFirstRelease: false,
      });

      artists = [
        {
          artist: fallbackArtist,
          role: 'primary',
        } as any,
      ];
    }

    const payload = {
      releaseId: release.id, // 🔥 IMPORTANT
      title: release.title,
      distributor: release.distributor,

      artists: artists.map((r: any) => ({
        name: r.artist?.name,
        spotifyArtistId: r.artist?.spotifyId,
        appleMusicId: r.artist?.appleMusicId,
      })),

      tracks: (release.music || []).map((t: any) => ({
        title: t.title,
        isrc: t.isrc,
        audioUrl: t.fileUrl,
      })),
    };

    // 🚀 THIS already queues the job
   console.log('🚫 Distribution skipped (internal mode)');

const result = {
  success: true,
  message: 'Stored internally only',
};

    return result;
  }

  // =========================
  // 📤 UPLOAD TRACK
  // =========================
  async uploadTrackToRelease(releaseId: number, data: any) {
    return this.musicService.uploadMusic({
      ...data,
      body: {
        ...data.body,
        releaseId,
      },
    });
  }

  // =========================
  // 📜 GET ALL
  // =========================
  async findAll() {
    return this.releaseRepo.find({
      relations: [
        'user',
        'music',
        'releaseArtists',
        'releaseArtists.artist',
      ],
      order: { id: 'DESC' },
    });
  }

  // =========================
  // 📜 USER RELEASES
  // =========================
  async getUserReleases(userId: number) {
    return this.releaseRepo.find({
      where: { user: { id: userId } as any },
      relations: ['music', 'releaseArtists', 'releaseArtists.artist'],
      order: { id: 'DESC' },
    });
  }

  // =========================
  // 🔍 FIND ONE
  // =========================
  async findOne(id: number) {
    const release = await this.releaseRepo.findOne({
      where: { id },
      relations: ['user', 'music', 'releaseArtists', 'releaseArtists.artist'],
    });

    if (!release) throw new BadRequestException('Release not found');

    return release;
  }

  // =========================
// 🔄 UPDATE RELEASE (USED BY WORKER)
// =========================
async update(id: number, data: Partial<Release>) {
  const release = await this.releaseRepo.findOne({
    where: { id },
  });

  if (!release) {
    throw new BadRequestException('Release not found');
  }

  Object.assign(release, data);

  return this.releaseRepo.save(release);
}

// =========================
// 🔗 UPDATE BY DISTRIBUTION ID
// =========================
async updateByDistributionId(
  distributionId: string,
  data: Partial<Release>,
) {
  const release = await this.releaseRepo.findOne({
    where: { distributionId },
  });

  if (!release) return;

  Object.assign(release, data);

  return this.releaseRepo.save(release);
}

  // =========================
  // 🔗 FIND BY SLUG
  // =========================
  async findBySlug(slug: string) {
    const release = await this.releaseRepo.findOne({
      where: { slug },
      relations: ['user', 'music', 'releaseArtists', 'releaseArtists.artist'],
    });

    if (!release) throw new BadRequestException('Release not found');

    return release;
  }

  // =========================
  // 🔗 WEBHOOK
  // =========================
  async markLiveByDistributionId(distributionId: string) {
  const release = await this.releaseRepo.findOne({
    where: { distributionId },
  });

  if (!release) return;

  release.status = 'live';
  release.liveAt = new Date();
  await this.releaseRepo.save(release);
}

// ✅ NOW INSIDE CLASS
// =========================
// 📥 ADMIN: GET PENDING RELEASES
// =========================
async getPendingReleases() {
  return this.releaseRepo.find({
    where: { approvalStatus: 'pending' },
    relations: ['user', 'music'],
    order: { id: 'DESC' },
  });
}

// =========================
// ✅ ADMIN: APPROVE RELEASE
// =========================
async approveRelease(id: number) {
  const release = await this.releaseRepo.findOne({
    where: { id },
    relations: ['user'],
  });

  if (!release) {
    throw new BadRequestException('Release not found ❌');
  }

  release.approvalStatus = 'approved';

  // ✅ DO NOT DISTRIBUTE YET
  release.status = 'ready'; // or 'stored'

  await this.releaseRepo.save(release);

  // 📧 EMAIL STILL WORKS
  if (release.user?.email) {
    await this.emailService.send(
      release.user.email,
      '✅ Release Approved',
      `Your release "${release.title}" is saved and will be distributed soon.`,
      { name: release.artistName }
    );
  }

  return {
    success: true,
    message: 'Release approved (stored only, not distributed yet) ✅',
  };
}

// =========================
// ❌ ADMIN: REJECT RELEASE
// =========================
async rejectRelease(id: number, reason?: string) {
  const release = await this.releaseRepo.findOne({
    where: { id },
    relations: ['user'],
  });

  if (!release) {
    throw new BadRequestException('Release not found ❌');
  }

  release.approvalStatus = 'rejected';
  (release as any).rejectionReason = reason || null;

  await this.releaseRepo.save(release);

  // ✅ SAFE STRING (THIS FIXES YOUR ERROR)
  const message = `
    Your release <b>${release.title}</b> was not approved.<br/><br/>

    ${
      reason
        ? `📝 <b>Reason:</b><br/>${reason}<br/><br/>`
        : ''
    }

    Please review and upload again.
  `;

  if (release.user?.email) {
    await this.emailService.send(
      release.user.email,
      '❌ Release Rejected',
      message,
      {
        name: release.artistName,
      }
    );
  }

  return {
    success: true,
    message: 'Release rejected ❌',
  };
}

}