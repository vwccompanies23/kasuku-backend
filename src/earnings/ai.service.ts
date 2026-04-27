import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  predictGrowth(months: number[]) {
    if (months.length < 2) return 0;

    const last = months[months.length - 1];
    const prev = months[months.length - 2];

    if (prev === 0) return 0;

    return Number((((last - prev) / prev) * 100).toFixed(2));
  }

  predictNext(months: number[]) {
    if (!months.length) return 0;

    const avg =
      months.reduce((a, b) => a + b, 0) / months.length;

    return Number(avg.toFixed(2));
  }
}