import { Controller, Post, Body } from '@nestjs/common';

import { ReleasesService } from '../releases/releases.service';
import { RoyaltyService } from '../royalties/royalty.service';
import { PayoutsService } from '../payouts/payouts.service';
import { DistributionGateway } from './distribution.gateway';

@Controller('distribution/webhook')
export class DistributionWebhookController {
  constructor(
    private readonly releasesService: ReleasesService,
    private readonly royaltyService: RoyaltyService,
    private readonly payoutsService: PayoutsService,
    private readonly gateway: DistributionGateway,
  ) {}

  @Post()
  async handle(@Body() body: any) {
    const { distributionId, status, earnings } = body;

    // 🔥 Always fetch release from DB (trusted source)
    const release =
      await this.releasesService.findByDistributionId(distributionId);

    const userId = release?.user?.id;

    if (!release) {
      console.warn(`⚠️ No release found for distributionId ${distributionId}`);
      return { success: true };
    }

    // =========================
    // 🔄 STATUS HANDLING
    // =========================
    if (status === 'delivered') {
      await this.releasesService.updateByDistributionId(distributionId, {
        status: 'delivered',
        deliveredAt: new Date(),
      });

      if (userId) {
        this.gateway.sendUpdateToUser(userId, {
          distributionId,
          status: 'delivered',
        });
      }
    }

    if (status === 'live') {
      await this.releasesService.updateByDistributionId(distributionId, {
        status: 'live',
        liveAt: new Date(),
      });

      if (userId) {
        this.gateway.sendUpdateToUser(userId, {
          distributionId,
          status: 'live',
        });
      }
    }

    if (status === 'failed') {
      await this.releasesService.updateByDistributionId(distributionId, {
        status: 'failed',
        failedAt: new Date(),
      });

      if (userId) {
        this.gateway.sendUpdateToUser(userId, {
          distributionId,
          status: 'failed',
        });
      }
    }

    // =========================
    // 💰 ROYALTIES + BALANCE
    // =========================
    if (earnings && userId) {
      await this.royaltyService.credit(
        Number(userId),
        Number(earnings),
        'distribution',
      );

      await this.payoutsService.addToBalance(
        Number(userId),
        Number(earnings),
      );
    }

    return { success: true };
  }
}