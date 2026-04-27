import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { RoyaltiesModule } from '../royalties/royalty.module';
import { ReleasesModule } from '../releases/releases.module';
import { EmailModule } from '../email/email.module';

import { User } from '../users/user.entity';
import { Earning } from './earning.entity';
import { AiService } from './ai.service';

import { EarningsService } from './earnings.service';
import { EarningsController } from './earnings.controller';
import { EarningsCron } from './earnings.cron';

import { EarningsProcessor } from './earnings.processor';
import { ImportService } from './import.service';

@Module({
  imports: [
    // ✅ ONLY ENTITIES HERE
    TypeOrmModule.forFeature([Earning, User]),

    BullModule.registerQueue({
      name: 'earnings',
    }),

    EventEmitterModule.forRoot(),

    RoyaltiesModule,
    ReleasesModule,
    EmailModule,
  ],

  providers: [
    EarningsService,
    EarningsCron,
    EarningsProcessor,
    ImportService, // ✅ ADD THIS HERE
    AiService,
  ],

  controllers: [EarningsController],

  exports: [EarningsService],
})
export class EarningsModule {}