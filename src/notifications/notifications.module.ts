import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

import { UsersModule } from '../users/users.module';

// 🔥 ADD THIS
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    UsersModule,

    JwtModule.register({
      secret: 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '1h' },
    }),
  ],

  // 🔥 ADD GATEWAY HERE
  providers: [
    NotificationsService,
    NotificationsGateway, // ✅ THIS FIXES YOUR ERROR
  ],

  controllers: [NotificationsController],

  // 🔥 EXPORT BOTH (IMPORTANT)
  exports: [
    NotificationsService,
    NotificationsGateway, // ✅ SO PaymentsService CAN USE IT
  ],
})
export class NotificationsModule {}