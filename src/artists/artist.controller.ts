import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ArtistService } from './artist.service';

@Controller('artists')
export class ArtistController {
  constructor(private artistService: ArtistService) {}

  // =========================
  // CREATE / FIND
  // =========================
  @Post()
  async create(
    @Body()
    body: {
      name: string;
      isFirstRelease: boolean;
      spotifyId?: string;
      appleMusicId?: string;
      youtubeChannelId?: string;
    },
  ) {
    return this.artistService.findOrCreate({
      name: body.name,
      isFirstRelease: body.isFirstRelease,
      spotifyId: body.spotifyId,
      appleMusicId: body.appleMusicId,
      youtubeChannelId: body.youtubeChannelId,
    });
  }

  // =========================
  // SEARCH
  // =========================
  @Get('search')
  async search(@Query('name') name: string) {
    return this.artistService.search(name);
  }

  // =========================
  // LINK PLATFORM IDS
  // =========================
  @Post('link')
  async link(
    @Body()
    body: {
      artistId: number;
      spotifyId?: string;
      appleMusicId?: string;
      youtubeChannelId?: string;
    },
  ) {
    return this.artistService.linkPlatform(body.artistId, body);
  }
}