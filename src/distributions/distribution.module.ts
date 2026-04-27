import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DistributionGateway } from './distribution.gateway';

import { DistributionService } from './distribution.service';
import { DistributionWebhookController } from './distribution.webhook.controller';
import { DistributionProcessor } from './distribution.processor';

import { RoyaltiesModule } from '../royalties/royalty.module';
import { ReleasesModule } from '../releases/releases.module';
import { PayoutsModule } from 'src/payouts/payouts.module';

// 🔥 NEW
import { ToolostProvider } from './providers/toolost.provider';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'distribution',
    }),
    RoyaltiesModule,
    forwardRef(() => ReleasesModule),
    PayoutsModule,
  ],
  controllers: [DistributionWebhookController],
  providers: [
    DistributionService,
    ToolostProvider,
    DistributionProcessor,
    DistributionGateway,
  ],
  exports: [DistributionService],
})
export class DistributionModule {}