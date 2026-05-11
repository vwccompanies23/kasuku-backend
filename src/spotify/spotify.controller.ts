// spotify.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotify: SpotifyService) {}

  @Get('search')
  async search(@Query('name') name: string) {
    return this.spotify.searchArtist(name);
  }
}