import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
import { SubscriptionModule } from './subscripetions/subscription.module';
import { RevenueModule } from './revenue/revenue.module';
import { TaxModule } from './tax/tax.module';
import { PaypalModule } from './paypal/paypal.module';
import { SettingsModule } from './settings/settings.module';
import { UploadModule } from './upload/upload.module';
import { PostsModule } from './posts/posts.module';

// 🧠 CONTROLLERS
import { AdminController } from './admin/admin.controller';
import { CheckoutController } from './payments/checkout.controller';
import { RevenueController } from './revenue/revenue.controller';

// 🧠 SERVICES
import { CurrencyService } from './common/currency.service';
import { ReleaseEvents } from './events/release.events';
import { NotificationsGateway } from './notifications/notifications.gateway';

// 🧾 ENTITIES
import { User } from './users/user.entity';
import { Revenue } from './revenue/revenue.entity';
import { WithdrawalModule } from './withdrawals/withdrawal.module';

console.log('JWT:', process.env.JWT_SECRET);
console.log('REDIS HOST:', process.env.REDIS_HOST);
console.log('REDIS PORT:', process.env.REDIS_PORT);
console.log(
  'REDIS PASSWORD:',
  process.env.REDIS_PASSWORD ? 'SET' : 'MISSING',
);

@Module({
  imports: [
    // ✅ CONFIG
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ DATABASE
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),

    // ✅ REDIS
    BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: {},
  },
}),

    // ✅ STATIC FILES (for music access)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // ✅ CORE
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    // ✅ AUTH
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
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
    SettingsModule,
    UploadModule, // ✅ THIS IS ENOUGH
    PostsModule,
    WithdrawalModule,
  ],

  controllers: [
    AdminController,
    CheckoutController,
    RevenueController,
    // ❌ DO NOT PUT UploadController HERE
  ],

  providers: [
    NotificationsGateway,
    CurrencyService,
    ReleaseEvents,
  ],
})
export class AppModule {}