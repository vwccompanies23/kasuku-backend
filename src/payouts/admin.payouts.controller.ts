import { Controller, Get, Post, Param } from '@nestjs/common';
import { PayoutsService } from './payouts.service';

@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  // =========================
  // 📊 ALL PAYOUTS
  // =========================
  @Get()
  getAll() {
    return this.payoutsService.getAllPayouts();
  }

  // =========================
  // ❌ FAILED PAYOUTS
  // =========================
  @Get('failed')
  getFailed() {
    return this.payoutsService.getFailedPayouts();
  }

  // =========================
  // 🔁 RETRY
  // =========================
  @Post('retry/:id')
  retry(@Param('id') id: string) {
    return this.payoutsService.retryPayout(Number(id));
  }

  // =========================
  // 🔓 UNLOCK
  // =========================
  @Post('unlock/:id')
  unlock(@Param('id') id: string) {
    return this.payoutsService.forceUnlock(Number(id));
  }

  // =========================
  // ⚡ FORCE PROCESS
  // =========================
  @Post('force/:id')
  force(@Param('id') id: string) {
    return this.payoutsService.forceProcess(Number(id));
  }
}