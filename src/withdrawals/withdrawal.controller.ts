import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';

import { WithdrawalService } from './withdrawal.service';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('withdraw')
export class WithdrawalController {
  constructor(private readonly withdrawService: WithdrawalService) {}

  // 🔐 USER REQUEST (token required)
  @UseGuards(JwtAuthGuard)
  @Post()
  requestWithdraw(@Request() req, @Body() body: any) {
    return this.withdrawService.requestWithdraw(
      req.user.id, // 🔥 comes from token
      Number(body.amount),
    );
  }

  // 🔒 ADMIN ROUTES
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  getAll() {
    return this.withdrawService.getAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('approve/:id')
  approve(@Param('id') id: string) {
    return this.withdrawService.approve(Number(id));
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('reject/:id')
  reject(@Param('id') id: string) {
    return this.withdrawService.reject(Number(id));
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('paid/:id')
  markPaid(@Param('id') id: string) {
    return this.withdrawService.markPaid(Number(id));
  }
}