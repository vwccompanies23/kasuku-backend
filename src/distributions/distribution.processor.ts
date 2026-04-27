import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { DistributionService } from './distribution.service';
import { ReleasesService } from '../releases/releases.service';
import { DistributionGateway } from './distribution.gateway';

@Processor('distribution')
export class DistributionProcessor {
  constructor(
    private readonly distributionService: DistributionService,
    private readonly releasesService: ReleasesService,
    private readonly gateway: DistributionGateway,
  ) {}

  @Process('distribute')
  async handle(job: Job) {
    const { releaseId, payload } = job.data;

    console.log(`\n🚀 [JOB START] Release ${releaseId}`);
    console.log(`🔁 Attempt: ${job.attemptsMade + 1}`);

    try {
      // 🔥 Get release + user
      const release = await this.releasesService.findOne(releaseId);
      const userId = release?.user?.id;

      if (!userId) {
        console.warn(`⚠️ No userId found for release ${releaseId}`);
      }

      // =========================
      // 🔄 PROCESSING
      // =========================
      await this.releasesService.update(releaseId, {
        status: 'processing',
        processingAt: new Date(),
      });

      if (userId) {
        this.gateway.sendUpdateToUser(userId, {
          releaseId,
          status: 'processing',
        });
      }

      console.log(`📦 Release ${releaseId} → processing`);

      // =========================
      // 🎧 DISTRIBUTION
      // =========================
      // 🎧 FAKE DISTRIBUTION (TEMP)
console.log('🚫 Distribution disabled (staying inside app)');

const result = {
  success: true,
  message: 'Stored internally only',
};

      // =========================
      // 📤 SUBMITTED
      // =========================
      await this.releasesService.update(releaseId, {
        status: 'submitted',
        submittedAt: new Date(),
      });

      if (userId) {
        this.gateway.sendUpdateToUser(userId, {
          releaseId,
          status: 'submitted',
        });
      }

      console.log(`📤 Release ${releaseId} → submitted`);
      console.log(`✅ [SUCCESS] Release ${releaseId}`);

      return result;
    } catch (error) {
      console.error(`❌ [FAILED] Release ${releaseId}`);
      console.error(error);

      // =========================
      // 💥 FAILURE
      // =========================
      if (job.attemptsMade >= 4) {
        console.error(`🚨 Release ${releaseId} permanently failed`);

        await this.releasesService.update(releaseId, {
          status: 'failed',
          failedAt: new Date(),
        });

        try {
          const release = await this.releasesService.findOne(releaseId);
          const userId = release?.user?.id;

          if (userId) {
            this.gateway.sendUpdateToUser(userId, {
              releaseId,
              status: 'failed',
            });
          }
        } catch (e) {
          console.warn('⚠️ Failed to emit socket update on failure');
        }
      }

      // 🔥 IMPORTANT: allows Bull retry
      throw error;
    }
  }
}