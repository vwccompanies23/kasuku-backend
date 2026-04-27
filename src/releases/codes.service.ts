import { Injectable } from '@nestjs/common';

@Injectable()
export class CodesService {

  // 🔥 OPTIONAL: your distributor prefix
  private readonly registrantCode = 'KSK';

  // =========================
  // 🆔 GENERATE ISRC
  // =========================
  generateISRC(): string {
    const country = 'US';
    const registrant = this.registrantCode;
    const year = new Date().getFullYear().toString().slice(-2);

    const designation = Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, '0');

    return `${country}-${registrant}-${year}-${designation}`;
  }

  // =========================
  // 📦 GENERATE UPC
  // =========================
  generateUPC(): string {
    const random = Math.floor(
      100000000000 + Math.random() * 900000000000,
    ).toString();

    return random;
  }

  // =========================
  // 🔥 BATCH ISRC GENERATION (FIXED)
  // =========================
  generateMultipleISRC(count: number): string[] {
    const codes: string[] = []; // ✅ FIX

    for (let i = 0; i < count; i++) {
      codes.push(this.generateISRC());
    }

    return codes;
  }
}