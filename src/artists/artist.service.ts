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
      isVerified: false,
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

    const artist: Artist = this.artistRepo.create({
      name: data.name,
      spotifyId: data.spotifyId,
      appleMusicId: data.appleMusicId,
      youtubeChannelId: data.youtubeChannelId,
      isNew: false,
      isVerified: true,
    });

    return await this.artistRepo.save(artist);
  }

  // =========================
  // 🤖 AUTO MATCH DSP
  // =========================
  async autoMatchDSP(
    name: string,
  ) {

    console.log(
      '🎵 DSP matching skipped (internal mode)',
    );

    return null;
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

    let artist: Artist | null =
      await this.artistRepo.findOne({
        where: { name: data.name },
      });

    if (artist) return artist;

    const match =
      await this.autoMatchDSP(data.name);

    if (data.isFirstRelease) {
      artist =
        await this.createNewArtist(data.name);
    } else {
      artist =
        await this.linkExistingArtist(data);
    }

    if (
      match &&
      (match as any).spotifyId
    ) {
      artist.spotifyId =
        (match as any).spotifyId;
    }

    return await this.artistRepo.save(artist);
  }

  // =========================
  // 🔍 SEARCH ARTISTS
  // =========================
  async search(
    name: string,
  ): Promise<Artist[]> {

    return this.artistRepo.find({
      where: {
        name: ILike(`%${name}%`),
      },
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

    const artist =
      await this.artistRepo.findOne({
        where: { id: artistId },
      });

    if (!artist) {
      throw new BadRequestException(
        'Artist not found',
      );
    }

    if (data.spotifyId) {
      artist.spotifyId =
        data.spotifyId;
    }

    if (data.appleMusicId) {
      artist.appleMusicId =
        data.appleMusicId;
    }

    if (data.youtubeChannelId) {
      artist.youtubeChannelId =
        data.youtubeChannelId;
    }

    artist.isVerified = true;

    return await this.artistRepo.save(artist);
  }
}