import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTrack } from './email-track.entity';

@Controller()
export class TrackController {
  constructor(
    @InjectRepository(EmailTrack)
    private trackRepo: Repository<EmailTrack>,
  ) {}

  // 📬 OPEN TRACK
  @Get('track-open')
  async trackOpen(@Query('email') email: string, @Res() res: Response) {
    let record = await this.trackRepo.findOne({ where: { email } });

    if (!record) {
      record = this.trackRepo.create({ email, opens: 1 });
    } else {
      record.opens += 1;
    }

    await this.trackRepo.save(record);

    const pixel = Buffer.from(
      'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      'base64',
    );

    res.setHeader('Content-Type', 'image/gif');
    res.end(pixel);
  }

  // 🔗 CLICK TRACK
  @Get('track-click')
  async trackClick(
    @Query('email') email: string,
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    let record = await this.trackRepo.findOne({ where: { email } });

    if (!record) {
      record = this.trackRepo.create({ email, clicks: 1 });
    } else {
      record.clicks += 1;
    }

    await this.trackRepo.save(record);

    return res.redirect(url);
  }
}