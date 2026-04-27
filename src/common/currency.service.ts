import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyService {
  // You can later replace this with live API
  private rate = 2300;

  convertUSDtoCDF(amount: number) {
    return amount * this.rate;
  }

  formatUSD(amount: number) {
    return `$${amount}`;
  }

  formatCDF(amount: number) {
    return `${amount.toLocaleString()} FC`;
  }

  getDisplayPrice(amountUSD: number) {
    const cdf = this.convertUSDtoCDF(amountUSD);

    return {
      usd: this.formatUSD(amountUSD),
      cdf: this.formatCDF(cdf),
    };
  }
}