import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';

// 🔐 AUTH
import { AuthModule } from './auth/auth.module';

// 💰 EARNINGS
import { EarningsModule } from './earnings/earnings.module';

// 📊 OTHER MODULES
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailModule } from './email/email.module';
import { CollaboratorsModule } from './collaborators/collaborators.module';
import { UsersModule } from './users/users.module';
import { ReleasesModule } from './releases/releases.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PayoutsModule } from './payouts/payouts.module';
import { DistributionModule } from './distributions/distribution.module';
import { EventsModule } from './events/events.module';
import { ArtistModule } from './artists/artist.module';
import { PaymentsModule } from './payments/payments.module';
import { MusicModule } from './music/music.module';
import { I18nModule } from './i18n/i18n.module';

// 🧠 SERVICES / CONTROLLERS
import { AdminController } from './admin/admin.controller';
import { CurrencyService } from './common/currency.service';
import { ReleaseEvents } from './events/release.events';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { SubscriptionModule } from './subscripetions/subscription.module';
import { CheckoutController } from './payments/checkout.controller';

import { Revenue } from './revenue/revenue.entity';
import { RevenueService } from './revenue/revenue.service';
import { RevenueController } from './revenue/revenue.controller';
import { TaxModule } from './tax/taxt.module';
import { PaypalModule } from './paypal/paypal.module';
import { ConfigService } from '@nestjs/config';

// 🧾 ENTITIES
import { User } from './users/user.entity';
import { RevenueModule } from './revenue/revenue.module';
import { SettingsModule } from './settings/settings.module';
import { UploadModule } from './upload/upload.module';
import { PostsModule } from './posts/posts.module';

console.log('JWT:', process.env.JWT_SECRET);

@Module({
  imports: [
    // ✅ GLOBAL CONFIG
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ✅ SCHEDULER
    ScheduleModule.forRoot(),

    // ✅ EVENTS
    EventEmitterModule.forRoot(),

    // ✅ REDIS QUEUE
    BullModule.forRoot({
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),

    // ✅ AUTH STRATEGY
    PassportModule.register({ defaultStrategy: 'jwt' }),

  JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '7d' },
}),

    // ✅ DATABASE (🔥 FIXED)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Levoboys99$%', // ✅ YOUR REAL PASSWORD
      database: 'kasuku',
      autoLoadEntities: true,
      synchronize: true,
    }),

    // ✅ ENTITY ACCESS
    TypeOrmModule.forFeature([User, Revenue]),

    // ✅ ALL MODULES
    UsersModule,
    ReleasesModule,
    EarningsModule,
    NotificationsModule,
    PayoutsModule,
    DistributionModule,
    AuthModule,
    AnalyticsModule,
    EmailModule,
    CollaboratorsModule,
    EventsModule,
    ArtistModule,
    PaymentsModule,
    MusicModule,
    I18nModule,
    SubscriptionModule,
    RevenueModule,
    TaxModule,
    PaypalModule,
    ArtistModule,
    SettingsModule,
    UploadModule,
    PostsModule,
  ],

  controllers: [AdminController, CheckoutController, RevenueController],

  providers: [
    NotificationsGateway,
    CurrencyService,
    ReleaseEvents,
  ],
})
export class AppModule {}