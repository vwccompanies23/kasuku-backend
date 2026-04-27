import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Artist } from './artist.entity';
import axios from 'axios';

@Injectable()
export class ArtistService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepo: Repository<Artist>,
  ) {}

  // =========================
  // 🎤 CREATE NEW ARTIST
  // =========================
  async createNewArtist(name: string): Promise<Artist> {
    const artist: Artist = this.artistRepo.create({
      name,
      isNew: true,
      isVerified: false, // ✅ FIXED
    });

    return await this.artistRepo.save(artist);
  }

  // =========================
  // 🔗 LINK EXISTING ARTIST
  // =========================
  async linkExistingArtist(data: {
    name: string;
    spotifyId?: string;
    appleMusicId?: string;
    youtubeChannelId?: string;
  }): Promise<Artist> {
    if (!data.spotifyId && !data.appleMusicId && !data.youtubeChannelId) {
      throw new BadRequestException(
        'At least one platform ID is required',
      );
    }

    const artist: Artist = this.artistRepo.create({
      name: data.name,
      spotifyId: data.spotifyId,
      appleMusicId: data.appleMusicId,
      youtubeChannelId: data.youtubeChannelId,
      isNew: false,
      isVerified: true, // ✅ FIXED
    });

    return await this.artistRepo.save(artist);
  }

  // =========================
  // 🤖 AUTO MATCH DSP
  // =========================
  async autoMatchDSP(name: string) {
    try {
      const spotifyRes: any = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist`,
        {
          headers: {
            Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`,
          },
        },
      );

      const artist = spotifyRes?.data?.artists?.items?.[0];

      return {
        spotifyId: artist?.id || null,
        spotifyName: artist?.name || null,
      };
    } catch (err: any) {
      console.log('DSP match failed', err?.message);
      return null;
    }
  }

  // =========================
  // 🔥 FIND OR CREATE
  // =========================
  async findOrCreate(data: {
    name: string;
    isFirstRelease: boolean;
    spotifyId?: string;
    appleMusicId?: string;
    youtubeChannelId?: string;
  }): Promise<Artist> {
    let artist: Artist | null = await this.artistRepo.findOne({
      where: { name: data.name },
    });

    if (artist) return artist;

    const match = await this.autoMatchDSP(data.name);

    if (data.isFirstRelease) {
      artist = await this.createNewArtist(data.name);
    } else {
      artist = await this.linkExistingArtist(data);
    }

    if (match?.spotifyId) {
      artist.spotifyId = match.spotifyId;
      artist.isVerified = true; // ✅ FIXED
    }

    return await this.artistRepo.save(artist);
  }

  // =========================
  // 🔍 SEARCH ARTISTS
  // =========================
  async search(name: string): Promise<Artist[]> {
    return this.artistRepo.find({
      where: { name: ILike(`%${name}%`) },
      take: 10,
    });
  }

  // =========================
  // 🔗 LINK PLATFORM
  // =========================
  async linkPlatform(
    artistId: number,
    data: {
      spotifyId?: string;
      appleMusicId?: string;
      youtubeChannelId?: string;
    },
  ): Promise<Artist> {
    const artist = await this.artistRepo.findOne({
      where: { id: artistId },
    });

    if (!artist) throw new BadRequestException('Artist not found');

    if (data.spotifyId) artist.spotifyId = data.spotifyId;
    if (data.appleMusicId) artist.appleMusicId = data.appleMusicId;
    if (data.youtubeChannelId) artist.youtubeChannelId = data.youtubeChannelId;

    artist.isVerified = true; // ✅ FIXED

    return await this.artistRepo.save(artist);
  }
}