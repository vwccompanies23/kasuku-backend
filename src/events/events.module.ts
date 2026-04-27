import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsService } from './events.service';

// ✅ NEW
import { ReleaseLiveListener } from './release-live.listener';

// 🔥 ADD THIS
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),

    // ✅ ADD THIS ONLY
    NotificationsModule,
  ],
  providers: [
    EventsService,
    ReleaseLiveListener,
  ],
  exports: [EventsService],
})
export class EventsModule {}