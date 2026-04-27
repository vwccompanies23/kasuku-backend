import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unsubscribe } from './unsubscribe.entity';

@Controller()
export class UnsubscribeController {
  constructor(
    @InjectRepository(Unsubscribe)
    private repo: Repository<Unsubscribe>,
  ) {}

  @Get('unsubscribe')
  async unsubscribe(@Query('email') email: string) {
    await this.repo.save({ email });

    return {
      message: 'You have been unsubscribed ✅',
    };
  }
}