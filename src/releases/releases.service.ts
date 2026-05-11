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

  if (!user) {
    throw new BadRequestException(
      'User not found',
    );
  }

  const artist =
    await this.artistService.findOrCreate({
      name: data.artistName,
      isFirstRelease:
        data.isFirstRelease,
      spotifyId: data.spotifyId,
      appleMusicId:
        data.appleMusicId,
      youtubeChannelId:
        data.youtubeChannelId,
    });

  const release =
    this.releaseRepo.create({
      title: data.title,
      artistName: artist.name,
      user: {
        id: data.userId,
      } as any,

      upc:
        this.codesService.generateUPC(),

      distributor:
        user.plan === 'pro'
          ? 'toolost'
          : 'internal',

      approvalStatus: 'pending',
    });

  const saved =
    await this.releaseRepo.save(
      release as any,
    );

  console.log(
    '✅ RELEASE SAVED:',
    saved.id,
  );

  return saved;
}

// =========================
// 🔥 FULL RELEASE
// =========================
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
  const {
    body,
    cover,
    tracks,
    trackTitles,
    userId,
  } = data;

  if (!tracks || !tracks.length) {
    throw new BadRequestException(
      'No tracks uploaded ❌',
    );
  }

  const user =
    await this.userRepo.findOne({
      where: { id: userId },
    });

  if (!user) {
    throw new BadRequestException(
      'User not found',
    );
  }

  const artist =
    await this.artistService.findOrCreate({
      name: body.artistName,
      isFirstRelease:
        body.isFirstRelease,
    });

  // ✅ UPC
  const upc =
    body.upc ||
    this.codesService.generateUPC();

  // =========================
  // 🏷️ LABEL LOGIC
  // =========================
  let finalLabel = 'Kasuku';

  if (
    user.plan === 'artist' ||
    user.plan === 'pro'
  ) {
    finalLabel =
      body.labelName?.trim() ||
      user.artistName ||
      'Kasuku';
  }

  // =========================
  // 📦 CREATE RELEASE
  // =========================
  const release =
    this.releaseRepo.create({
      title: body.title,

      artistName: artist.name,
      
platforms: body.platforms || [],
      type:
        tracks.length > 1
          ? ReleaseType.ALBUM
          : ReleaseType.SINGLE,

      // 🎼 METADATA
      labelName: finalLabel,

      genre:
        body.genre || null,

      subgenre:
        body.subgenre || null,

      primaryGenre:
        body.primaryGenre || null,

      secondaryGenre:
        body.secondaryGenre ||
        null,

      language:
        body.language || null,

      metadataLanguage:
        body.metadataLanguage ||
        null,

      contentRating:
        body.contentRating ||
        'clean',

      songwriter:
        body.songwriter || null,

      composer:
        body.composer || null,

      producer:
        body.producer || null,

      copyrightOwner:
        body.copyrightOwner ||
        null,

      publishingRights:
        body.publishingRights ||
        null,

      releaseVersion:
        body.releaseVersion ||
        null,

      territory:
        body.territory || null,

      isCoverSong:
        body.isCoverSong ===
        'true',

      dolbyAtmos:
        body.dolbyAtmos ===
        'true',

      user: {
        id: userId,
      } as any,

      upc,

      distributor:
        user.plan === 'pro'
          ? 'toolost'
          : 'internal',

      status: 'draft',

      approvalStatus:
        'pending',

      releaseDate: body.date
        ? new Date(body.date)
        : undefined,

      originalReleaseDate:
        body.originalDate
          ? new Date(
              body.originalDate,
            )
          : undefined,
    });

  console.log(
    '🔥 ABOUT TO SAVE RELEASE',
  );

  console.log(release);

  try {
    // =========================
    // 💾 SAVE RELEASE
    // =========================
    const saved =
      await this.releaseRepo.save(
        release as any,
      );

    console.log(
      '✅ RELEASE SAVED:',
      saved,
    );

    const releaseId = saved.id;

    // =========================
    // 🎵 TRACKS
    // =========================
    console.log(
      '🔥 COVER FILE:',
      cover,
    );

    for (
      let i = 0;
      i < tracks.length;
      i++
    ) {
      const track = tracks[i];

      const title =
        trackTitles?.[i] ||
        `Track ${i + 1}`;

      const isrc =
        body.isrc &&
        tracks.length === 1
          ? body.isrc
          : this.codesService.generateISRC();

      await this.musicService.uploadMusic({
        cover,
        track,

        body: {
          title,

          artist:
            body.artistName,

          userId,

          releaseId,

          isrc,

          // 🌍 LANGUAGE
          language:
            body[
              `track_${i}_language`
            ] || null,

          // 🎼 GENRES
          primaryGenre:
            body[
              `track_${i}_primaryGenre`
            ] || null,

          secondaryGenre:
            body[
              `track_${i}_secondaryGenre`
            ] || null,

          // ✍️ SONGWRITER
          songwriterOption:
            body[
              `track_${i}_songwriterOption`
            ] || null,

          songwriterNames:
            body[
              `track_${i}_songwriterNames`
            ] || null,

          // 📻 RADIO
          radioEdit:
            body[
              `track_${i}_radioEdit`
            ] || 'no',

          previewStartTime:
            body[
              `track_${i}_previewStartTime`
            ] || null,

          // 🎤 FEATURES
          featuredArtists:
            body[
              `track_${i}_featuredArtists`
            ] || '[]',

          // 🔁 ORIGINAL SONG
          originalArtistName:
            body[
              `track_${i}_originalArtistName`
            ] || null,

          originalSongTitle:
            body[
              `track_${i}_originalSongTitle`
            ] || null,

          originalSongwriter:
            body[
              `track_${i}_originalSongwriter`
            ] || null,

          // 🚀 RELEASE STATUS
          releaseStatus:
            body.releaseStatus ||
            'not_live',
        },
      });
    }

    console.log(
      '✅ FULL RELEASE COMPLETE',
    );

    return this.findOne(
      releaseId,
    );

  } catch (err) {

    console.log(
      '❌ FULL RELEASE ERROR:',
    );

    console.log(err);

    console.log(
      '❌ ERROR MESSAGE:',
      err?.message,
    );

    console.log(
      '❌ ERROR DETAIL:',
      err?.detail,
    );

    console.log(
      '❌ ERROR QUERY:',
      err?.query,
    );

    throw err;
  }
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
  const releaseId = Number(id);

  // ✅ Prevent NaN crash
  if (isNaN(releaseId)) {
    throw new BadRequestException(
      'Invalid release ID ❌',
    );
  }

  const release = await this.releaseRepo.findOne({
    where: { id: releaseId },
    relations: [
      'user',
      'music',
      'releaseArtists',
      'releaseArtists.artist',
    ],
  });

  if (!release) {
    throw new BadRequestException(
      'Release not found ❌',
    );
  }

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

  await this.distributionService.sendRelease({
  releaseId: release.id,
  title: release.title,
  distributor: release.distributor,
  artists: [
    {
      name: release.artistName,
    },
  ],
  tracks: release.music?.map((t: any) => ({
    title: t.title,
    isrc: t.isrc,
    audioUrl: t.fileUrl,
  })),
});

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

// =========================
// ✏️ UPDATE RELEASE
// =========================
async updateRelease(
  id: number,
  data: any,
) {
  const release =
    await this.releaseRepo.findOne({
      where: { id },
      relations: ['music'],
    });

  if (!release) {
    throw new BadRequestException(
      'Release not found ❌',
    );
  }

  // ✅ BASIC INFO
  release.title =
    data.title || release.title;

  release.artistName =
    data.artistName ||
    release.artistName;

  // ✅ METADATA
  release.genre =
    data.genre || release.genre;

  release.subgenre =
    data.subgenre ||
    release.subgenre;

  release.primaryGenre =
    data.primaryGenre ||
    release.primaryGenre;

  release.secondaryGenre =
    data.secondaryGenre ||
    release.secondaryGenre;

  release.language =
    data.language ||
    release.language;

  release.metadataLanguage =
    data.metadataLanguage ||
    release.metadataLanguage;

  release.labelName =
    data.labelName ||
    release.labelName;

  release.songwriter =
    data.songwriter ||
    release.songwriter;

  release.composer =
    data.composer ||
    release.composer;

  release.producer =
    data.producer ||
    release.producer;

  release.copyrightOwner =
    data.copyrightOwner ||
    release.copyrightOwner;

  release.publishingRights =
    data.publishingRights ||
    release.publishingRights;

  release.releaseVersion =
    data.releaseVersion ||
    release.releaseVersion;

  release.territory =
    data.territory ||
    release.territory;

  release.contentRating =
    data.contentRating ||
    release.contentRating;

  // ✅ BOOLEAN FLAGS
  if (data.isCoverSong !== undefined) {
    release.isCoverSong =
      data.isCoverSong === 'true';
  }

  if (data.dolbyAtmos !== undefined) {
    release.dolbyAtmos =
      data.dolbyAtmos === 'true';
  }

  // ✅ FILES
  if (
    data.cover &&
    release.music?.[0]
  ) {
    release.music[0].coverUrl =
      data.cover;
  }

  if (
    data.audio &&
    release.music?.[0]
  ) {
    release.music[0].fileUrl =
      data.audio;
  }

  // ✅ SAVE TRACK
  if (release.music?.[0]) {
    await this.musicService.update(
      release.music[0].id,
      release.music[0],
    );
  }

  // ✅ SAVE RELEASE
  await this.releaseRepo.save(
    release,
  );

  return this.findOne(id);
}
}