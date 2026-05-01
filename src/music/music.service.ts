import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Music } from './music.entity';

import { RoyaltyService } from '../royalties/royalty.service';
import { User } from '../users/user.entity';
import { PLAN_LIMITS } from 'src/config/plans';
import { AudioAnalysisService } from './audio-analysis.service';

import { parseFile } from 'music-metadata';
import * as fs from 'fs';
import * as wav from 'node-wav';

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(Music)
    private musicRepo: Repository<Music>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private readonly audioAnalysis: AudioAnalysisService,
    private royaltyService: RoyaltyService,
  ) {}

 async uploadMusic(data: any) {
  const { cover, track, body } = data;

  // ✅ VALIDATION (ONLY ONCE)
  if (!body?.userId) {
    throw new BadRequestException('userId is required ❌');
  }

  const userId = Number(body.userId);

  if (isNaN(userId)) {
    throw new BadRequestException('Invalid userId ❌');
  }

  if (!track) {
    throw new BadRequestException('Track is required ❌');
  }

  // 👇 USE userId everywhere (DO NOT redeclare)
  const user = await this.userRepo.findOne({
    where: { id: userId },
  });

    // =========================
    // 🎧 FILE TYPE
    // =========================
    const allowedAudio = ['.mp3', '.wav'];
    const trackExt = track.originalname
      .toLowerCase()
      .substring(track.originalname.lastIndexOf('.'));

    if (!allowedAudio.includes(trackExt)) {
      throw new BadRequestException('Invalid audio file ❌');
    }

    // =========================
    // ⏱️ DURATION (fallback)
    // =========================
    let duration = 0;

    try {
      const metadata = await parseFile(track.path);
      duration = Math.round(metadata.format.duration || 0);
    } catch (err) {
      console.log('⚠️ Duration error:', err.message);
    }

    // =========================
    // 🎧 BPM + WAVEFORM + ENERGY
    // =========================
    let bpm: number | null = null;
    let waveform: number[] = [];
    let energy: number | null = null;

    try {
      const buffer = fs.readFileSync(track.path);

      if (trackExt === '.wav') {
        const decoded = wav.decode(buffer);
        const samples = decoded.channelData[0];

        const step = Math.floor(samples.length / 100);
        for (let i = 0; i < samples.length; i += step) {
          waveform.push(samples[i]);
        }

        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          sum += samples[i] * samples[i];
        }
        energy = Math.sqrt(sum / samples.length);

        let peaks = 0;
        const threshold = 0.6;

        for (let i = 1; i < samples.length - 1; i++) {
          if (
            samples[i] > threshold &&
            samples[i] > samples[i - 1] &&
            samples[i] > samples[i + 1]
          ) {
            peaks++;
          }
        }

        bpm = Math.round((peaks / duration) * 60);
      }
    } catch (err) {
      console.log('⚠️ Audio analysis failed:', err.message);
    }

    // =========================
    // 🔥 NEW AI ANALYSIS
    // =========================
    const analysis = await this.audioAnalysis.analyze(track.path);

    const hash = await this.audioAnalysis.generateHash(track.path);

    const existing = await this.musicRepo.findOne({
      where: { hash },
    });

    const isDuplicate = !!existing;

    const issues = this.audioAnalysis.detectIssues({
      ...analysis,
      isDuplicate,
    });

    console.log('🧠 AI Issues:', issues);

    // =========================
    // 🖼️ COVER
    // =========================
    let coverUrl: string | null = null;

    if (cover) {
      const allowedImages = ['.jpg', '.jpeg', '.png'];
      const coverExt = cover.originalname
        .toLowerCase()
        .substring(cover.originalname.lastIndexOf('.'));

      if (!allowedImages.includes(coverExt)) {
        throw new BadRequestException('Invalid cover image ❌');
      }

      coverUrl = `http://localhost:3000/uploads/${cover.filename}`;
    }

    // =========================
    // 📊 PLAN LIMIT
    // =========================
    if (!user) {
  throw new BadRequestException('User not found ❌');
}

// 🆓 Allow upload for everyone
if (!user.subscriptionActive && !user.isFreeOverride) {
  console.log('🆓 Free user uploading (40% commission applies)');
}

    const planKey = user.plan && PLAN_LIMITS[user.plan]
  ? user.plan
  : 'free';

const limits = PLAN_LIMITS[planKey];

if (!limits) {
  throw new Error('Plan configuration missing ❌');
}

    const uploads = await this.musicRepo.count({
      where: { user: { id: userId } },
    });

    if (uploads >= limits.uploads) {
      throw new Error('Upload limit reached. Upgrade your plan 🚀');
    }

    // =========================
    // 📦 CREATE MUSIC (UPDATED)
    // =========================
    const music = this.musicRepo.create({
      title: body.title || track.originalname,
      artist: body.artist || 'Unknown',

      fileUrl: `http://localhost:3000/uploads/${track.filename}`,
      coverUrl,

      duration: analysis.duration || duration,
      bpm: bpm ? Math.round(bpm) : 0,
      waveform,
      energy: energy ? Math.round(energy) : 0,

      // 🔥 NEW FIELDS
      bitrate: analysis.bitrate,
      fileSize: analysis.fileSize,
      loudness: analysis.loudness
  ? Math.round(analysis.loudness)
  : 0,
      hash,
      isDuplicate,
      issues,

      type: body.type || 'single',
      releaseDate: body.releaseDate || null,
      description: body.description || null,
      isrc: body.isrc || null,
      upc: body.upc || null,

      platforms: [],
      schedule: body.schedule || 'instant',

      user: body.userId
        ? ({ id: userId } as any)
        : null,

      release: body.releaseId
        ? ({ id: Number(body.releaseId) } as any)
        : null,
    });

    const saved = await this.musicRepo.save(music);

    return {
      success: true,
      data: saved,
    };
  }

  async deleteMusic(id: number) {
    const music = await this.musicRepo.findOne({ where: { id } });

    if (!music) {
      throw new BadRequestException('Music not found ❌');
    }

    await this.musicRepo.remove(music);

    return {
      success: true,
      message: 'Deleted successfully 🗑️',
    };
  }

  async incrementPlay(id: number) {
    const music = await this.musicRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!music) return;

    music.plays = (music.plays || 0) + 1;

    await this.musicRepo.save(music);

    if (music.user) {
      await this.royaltyService.credit(
        music.user.id,
        0.003,
        'stream',
      );
    }

    return { success: true };
  }

  async getAllMusic() {
    return this.musicRepo.find({
      relations: ['user', 'release'],
      order: { id: 'DESC' },
    });
  }

  async getStats() {
    const all = await this.musicRepo.find();

    const totalSongs = all.length;

    const totalPlays = all.reduce((sum, m) => {
      return sum + (m.plays || 0);
    }, 0);

    return {
      totalSongs,
      totalPlays,
    };
  }
}