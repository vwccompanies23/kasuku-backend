import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';

import { PaymentsModule } from '../payments/payments.module';
import { EarningsModule } from '../earnings/earnings.module';
import { I18nModule } from '../i18n/i18n.module';

import { Payout } from './payout.entity';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { User } from '../users/user.entity';
import { PayoutsCron } from './payouts.cron';
import { PaypalModule } from 'src/paypal/paypal.module';

// ✅ ADD THIS
import { PayoutProcessor } from './payout.processor';
import { AdminPayoutsController } from './admin.payouts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payout, User]),

    JwtModule.register({
      secret: 'SUPER_SECRET_KEY',
    }),

    // ✅ QUEUE REGISTER (IMPORTANT)
    BullModule.registerQueue({
      name: 'payouts',
    }),

    forwardRef(() => PaymentsModule),
    forwardRef(() => EarningsModule),

    I18nModule,
    PaypalModule,
  ],

  providers: [
    PayoutsService,
    PayoutsCron,

    // ✅ ADD THIS (worker)
    PayoutProcessor,
  ],

  controllers: [PayoutsController, AdminPayoutsController],

  exports: [PayoutsService],
})
export class PayoutsModule {}