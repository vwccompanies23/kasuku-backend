import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Music } from './music.entity';

import { RoyaltyService } from '../royalties/royalty.service';
import { User } from '../users/user.entity';
import { AudioAnalysisService } from './audio-analysis.service';

import { parseBuffer } from 'music-metadata';
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
    const { cover, track, body, cloudinaryUrl } = data;

    // ✅ VALIDATION
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

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found ❌');
    }

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
    // ⏱️ DURATION
    // =========================
    let duration = 0;

    try {
      const metadata = await parseBuffer(track.buffer, track.mimetype);
      duration = Math.round(metadata.format.duration || 0);
    } catch (err) {
      console.log('⚠️ Duration error:', err.message);
    }

    // =========================
    // 🎧 AUDIO ANALYSIS
    // =========================
    let bpm: number | null = null;
    let waveform: number[] = [];
    let energy: number | null = null;

    try {
      const buffer = track.buffer;

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
    // 🧠 AI ANALYSIS
    // =========================
    const analysis = await this.audioAnalysis.analyzeBuffer(track.buffer);
    const hash = await this.audioAnalysis.generateHashFromBuffer(track.buffer);

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
    let coverUrl: string | null = cover || null;

    // =========================
    // 💰 USER TYPE LOGIC
    // =========================
    let commission = 0;
    let features = 'basic';

    if (user.isFreeOverride) {
      commission = 0.2;
      features = 'full';
    } else if (user.subscriptionActive) {
      commission = 0;
      features = 'pro';
    } else {
      commission = 0.15;
      features = 'limited';
    }

    console.log(`User commission: ${commission * 100}%`);

    // =========================
    // 📦 CREATE MUSIC
    // =========================
    const music = this.musicRepo.create({
  commissionRate: commission,
  title: body.title || track.originalname,
  artist: body.artist || 'Unknown',

  fileUrl: cloudinaryUrl,
  coverUrl,

  duration: analysis.duration || duration,
  bpm: bpm ? Math.round(bpm) : 0,
  waveform,
  energy: energy ? Math.round(energy) : 0,

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

  user: { id: userId } as any,
  release: body.releaseId
    ? ({ id: Number(body.releaseId) } as any)
    : null,
} as any); // ✅ THIS LINE FIXES YOUR ERROR

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