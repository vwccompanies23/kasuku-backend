import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTrack } from './email-track.entity';

import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { UnsubscribeController } from './unsubcribe.controller';
import { Unsubscribe } from './unsubscribe.entity';

import { UsersModule } from '../users/users.module';
import { I18nModule } from 'src/i18n/i18n.module';
import { TrackController } from './track.controller';
import { EmailGateway } from './email.gateway';
import { Campaign } from './campaign.entity';

@Module({
  imports: [
    I18nModule,
    TypeOrmModule.forFeature([EmailTrack, Unsubscribe, Campaign]),

    // 🔥 FIX: ADD JWT MODULE
    JwtModule.register({
      secret: 'SECRET_KEY',
    }),
  ],
  providers: [EmailService, EmailGateway],
  exports: [EmailService, EmailGateway],
  controllers: [EmailController, UnsubscribeController, TrackController],
})
export class EmailModule {}