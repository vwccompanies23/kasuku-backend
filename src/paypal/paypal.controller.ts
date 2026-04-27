import { Controller, Post, Body, Req } from '@nestjs/common';
import { PaypalService } from './paypal.service';

@Controller('paypal')
export class PaypalController {
  constructor(private paypalService: PaypalService) {}

  @Post('withdraw')
  async withdraw(@Body() body, @Req() req) {
    const { email, amount } = body;

    // 🔒 You should validate user + balance here

    const result = await this.paypalService.sendPayout(
      email,
      Number(amount)
    );

    return {
      success: true,
      payoutId: result.batch_header.payout_batch_id,
    };
  }
}