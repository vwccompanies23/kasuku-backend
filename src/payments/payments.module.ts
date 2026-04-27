import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';

import { PaymentsGateway } from './payments.gateway';
import { PaymentsAdminController } from './payments.admin.controller';
import { StripeWebhookController } from './stripe.webhook.controller';
import { PaymentsController } from './payments.controller';
import { BillingController } from './billing.controller';
import { PaymentSettingsController } from './payment-settings.controller';

import { Transaction } from './transaction.entity';
import { PaymentSettings } from './payment-settings.entity';
import { User } from '../users/user.entity';
import { Release } from '../releases/release.entity';
import { Earning } from '../earnings/earning.entity'; // ✅🔥 KEEP

import { SplitsService } from './splits.service';
import { PaymentsWorker } from './payments.worker';
import { RevenueModule } from '../revenue/revenue.module';

// ✅ MODULES
import { PayoutsModule } from '../payouts/payouts.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

// 🔥🔥🔥 FIX HERE (IMPORTANT)
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentSettings,
      User,
      Transaction,
      Release,
      Earning,
    ]),

    RevenueModule, // ✅ correct

    JwtModule.register({
      secret: 'SECRET_KEY',
    }),

    forwardRef(() => PayoutsModule),
    forwardRef(() => UsersModule),

    NotificationsModule,
    I18nModule, // ✅ provides I18nService
  ],

  providers: [
    PaymentsService,
    StripeService,
    PaypalService,
    PaymentsGateway,
    PaymentsWorker,
    SplitsService,
    // ❌ removed I18nService
  ],

  controllers: [
    PaymentsController,
    PaymentsAdminController,
    StripeWebhookController,
    BillingController,
    PaymentSettingsController,
  ],

  exports: [
    PaymentsService,
    StripeService,
    PaypalService,
  ],
})
export class PaymentsModule {}