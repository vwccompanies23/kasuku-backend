import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

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
    const {
  cover,
  track,
  tracks,
  body,
  cloudinaryUrl,
} = data;

const audioFile =
  track || tracks?.[0];

    console.log('COVER:', cover);
    console.log(
      'COVER URL:',
      data.coverUrl,
    );

    // =========================
    // ✅ VALIDATION
    // =========================
    if (!body?.userId) {
      throw new BadRequestException(
        'userId is required ❌',
      );
    }

    const userId = Number(
      body.userId,
    );

    if (isNaN(userId)) {
      throw new BadRequestException(
        'Invalid userId ❌',
      );
    }

    if (!audioFile) {
      throw new BadRequestException(
        'Track is required ❌',
      );
    }

    const user =
      await this.userRepo.findOne({
        where: { id: userId },
      });

    if (!user) {
      throw new BadRequestException(
        'User not found ❌',
      );
    }

    // =========================
    // 🎧 FILE TYPE
    // =========================
    const allowedAudio = [
      '.mp3',
      '.wav',
    ];

    const trackExt =
      audioFile.originalname
        .toLowerCase()
        .substring(
          audioFile.originalname.lastIndexOf(
            '.',
          ),
        );

    if (
      !allowedAudio.includes(
        trackExt,
      )
    ) {
      throw new BadRequestException(
        'Invalid audio file ❌',
      );
    }

    // =========================
    // ⏱️ DURATION
    // =========================
    let duration = 0;

    try {
      console.log(
  '⚠️ Skipping duration analysis (disk storage mode)',
);

    } catch (err: any) {
      console.log(
        '⚠️ Duration error:',
        err.message,
      );
    }

    // =========================
    // 🎧 AUDIO ANALYSIS
    // =========================
    let bpm: number | null =
      null;

    let waveform: number[] =
      [];

    let energy: number | null =
      null;

    try {

      console.log(
  '⚠️ Skipping waveform analysis (disk storage mode)',
);

       {
        const decoded =
          wav.decode(
            audioFile.path,
          );

        const samples =
          decoded.channelData[0];

        if (samples?.length) {
          const step = Math.max(
            1,
            Math.floor(
              samples.length / 100,
            ),
          );

          for (
            let i = 0;
            i < samples.length;
            i += step
          ) {
            waveform.push(
              samples[i],
            );
          }

          let sum = 0;

          for (
            let i = 0;
            i < samples.length;
            i++
          ) {
            sum +=
              samples[i] *
              samples[i];
          }

          energy = Math.sqrt(
            sum / samples.length,
          );

          let peaks = 0;

          const threshold =
            0.6;

          for (
            let i = 1;
            i <
            samples.length - 1;
            i++
          ) {
            if (
              samples[i] >
                threshold &&
              samples[i] >
                samples[i - 1] &&
              samples[i] >
                samples[i + 1]
            ) {
              peaks++;
            }
          }

          bpm = duration
            ? Math.round(
                (peaks /
                  duration) *
                  60,
              )
            : 0;
        }
      }
    } catch (err: any) {
      console.log(
        '⚠️ Audio analysis failed:',
        err.message,
      );
    }

    // =========================
    // 🧠 AI ANALYSIS
    // =========================
    let analysis: any = {};

    let hash = '';
  {
    console.log(
  '⚠️ Skipping AI analysis (disk storage mode)',
);

      hash =
        await this.audioAnalysis.generateHash(
          audioFile.path,
        );
    }

    const existing =
      await this.musicRepo.findOne(
        {
          where: { hash },
        },
      );

    const isDuplicate =
      !!existing;

    const issues =
      this.audioAnalysis.detectIssues(
        {
          ...analysis,
          isDuplicate,
        },
      );

    console.log(
      '🧠 AI Issues:',
      issues,
    );

    // =========================
    // 🖼️ COVER
    // =========================
    let coverUrl:
      | string
      | null = null;

    if (cover?.filename) {
      coverUrl = `/uploads/${cover.filename}`;
    }

    // =========================
    // 💰 USER TYPE LOGIC
    // =========================
    let commission = 0;

    if (user.isFreeOverride) {
      commission = 0.2;
    } else if (
      user.subscriptionActive
    ) {
      commission = 0;
    } else {
      commission = 0.15;
    }

    console.log(
      `User commission: ${
        commission * 100
      }%`,
    );

    // =========================
    // 📦 CREATE MUSIC
    // =========================
    const music =
      this.musicRepo.create({
        commissionRate:
          commission,

        title:
          body.title ||
          audioFile.originalname,

        artist:
          body.artist ||
          'Unknown',

        fileUrl:
          cloudinaryUrl ||
          `/uploads/${audioFile.filename}`,

        coverUrl,

        status: 'processing',

        duration:
          analysis.duration ||
          duration,

        bpm: bpm
          ? Math.round(bpm)
          : 0,

        waveform,

        energy: energy
          ? Math.round(
              energy,
            )
          : 0,

        bitrate:
          analysis.bitrate,

        fileSize:
          analysis.fileSize,

        loudness:
          analysis.loudness
            ? Math.round(
                analysis.loudness,
              )
            : 0,

        hash,

        isDuplicate,

        issues,

        type:
          body.type ||
          'single',

        releaseDate:
          body.releaseDate ||
          null,

        description:
          body.description ||
          null,

        isrc:
          body.isrc || null,

        upc:
          body.upc || null,

        platforms: [],

        schedule:
          body.schedule ||
          'instant',

        user: {
          id: userId,
        } as any,

        release:
          body.releaseId
            ? ({
                id: Number(
                  body.releaseId,
                ),
              } as any)
            : null,
      } as any);

    // =========================
    // 💾 SAVE
    // =========================
    const saved =
      await this.musicRepo.save(
        music,
      );

    return {
      success: true,
      data: saved,
    };
  }

  async deleteMusic(
    id: number,
  ) {
    const music =
      await this.musicRepo.findOne(
        {
          where: { id },
        },
      );

    if (!music) {
      throw new BadRequestException(
        'Music not found ❌',
      );
    }

    await this.musicRepo.remove(
      music,
    );

    return {
      success: true,
      message:
        'Deleted successfully 🗑️',
    };
  }

  // =========================
  // ❌ DELETE MULTIPLE SONGS
  // =========================
  async deleteSongs(
    userId: number,
    ids: number[],
  ) {
    if (!ids || !ids.length) {
      throw new BadRequestException(
        'No songs selected ❌',
      );
    }

    const songs =
      await this.musicRepo.find({
        where: ids.map(
          (id) => ({
            id,
            user: {
              id: userId,
            } as any,
          }),
        ),
        relations: ['user'],
      });

    if (!songs.length) {
      throw new BadRequestException(
        'No valid songs found ❌',
      );
    }

    await this.musicRepo.remove(
      songs,
    );

    return {
      success: true,
      message: `${songs.length} song(s) deleted successfully 🗑️`,
    };
  }

  async requestDeleteSongs(
    userId: number,
    ids: number[],
  ) {
    const songs =
      await this.musicRepo.find({
        where: {
          user: {
            id: userId,
          } as any,
        },
      });

    const toUpdate =
      songs.filter((s) =>
        ids.includes(s.id),
      );

    for (const song of toUpdate) {
      (song as any).deleteRequested =
        true;
    }

    await this.musicRepo.save(
      toUpdate,
    );

    return {
      success: true,
      message:
        'Delete request sent for admin approval',
    };
  }

  async getUserMusic(
    userId: number,
  ) {
    const music =
      await this.musicRepo.find({
        where: {
          user: {
            id: Number(
              userId,
            ),
          },
        },
        relations: ['user'],
        order: { id: 'DESC' },
      });

    return music.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      fileUrl: song.fileUrl,
      coverUrl: song.coverUrl,
    }));
  }

  async incrementPlay(
    id: number,
  ) {
    const music =
      await this.musicRepo.findOne(
        {
          where: { id },
          relations: ['user'],
        },
      );

    if (!music) return;

    music.plays =
      (music.plays || 0) + 1;

    await this.musicRepo.save(
      music,
    );

    if (music.user) {
      await this.royaltyService.credit(
        music.user.id,
        0.003,
        'stream',
      );
    }

    return {
      success: true,
    };
  }

  async getAllMusic() {
    return this.musicRepo.find({
      relations: [
        'user',
        'release',
      ],
      order: { id: 'DESC' },
    });
  }

  async getStats() {
    const all =
      await this.musicRepo.find();

    const totalSongs =
      all.length;

    const totalPlays =
      all.reduce((sum, m) => {
        return (
          sum +
          (m.plays || 0)
        );
      }, 0);

    return {
      totalSongs,
      totalPlays,
    };
  }

  // =========================
  // ✏️ UPDATE MUSIC
  // =========================
  async update(
    id: number,
    data: any,
  ) {
    const music =
      await this.musicRepo.findOne(
        {
          where: { id },
        },
      );

    if (!music) {
      throw new BadRequestException(
        'Music not found ❌',
      );
    }

    Object.assign(
      music,
      data,
    );

    return this.musicRepo.save(
      music,
    );
  }
}