import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class SplitsService {

  // =========================
  // ✅ VALIDATE SPLITS
  // =========================
  validateSplits(splits: any[]) {
    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      throw new BadRequestException('Splits are required ❌');
    }

    let total = 0;

    splits.forEach((s, index) => {
      const percent = Number(s.percent);

      if (isNaN(percent) || percent <= 0) {
        throw new BadRequestException(
          `Invalid percentage for split #${index + 1} ❌`,
        );
      }

      if (!s.email) {
        throw new BadRequestException(
          `Missing email for split #${index + 1} ❌`,
        );
      }

      total += percent;
    });

    // 🔥 Ensure total is exactly 100
    if (Math.round(total) !== 100) {
      throw new BadRequestException(
        `Splits must equal 100% (currently ${total}%) ❌`,
      );
    }

    return splits;
  }

  // =========================
  // 💰 PROCESS SPLITS
  // =========================
  async processSplits(amount: number, splits: any[]) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount ❌');
    }

    return splits.map((s) => {
      const percent = Number(s.percent);

      // 💰 safe rounding (2 decimals)
      const payout = Number(
        ((amount * percent) / 100).toFixed(2),
      );

      return {
        email: s.email,
        percent,
        amount: payout,
      };
    });
  }
}