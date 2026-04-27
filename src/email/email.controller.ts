import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
} from '@nestjs/common';

import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // 📤 SEND ALL
  @Post('send-all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async sendToAll(
    @Body() body: { subject: string; message: string },
  ) {
    return this.emailService.sendToAll(body.subject, body.message);
  }

  @Post('campaign')
create(@Body() body) {
  return this.emailService.createCampaign(body.subject, body.message);
}


  // 📊 STATS (MOVE OUTSIDE METHOD)
  @Get('stats')
  async stats() {
    return this.emailService.getStats();
  }
}