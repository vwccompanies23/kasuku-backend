import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException, // ✅ ADD THIS
} from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  // 📊 DASHBOARD
  @Get('stats')
  getStats() {
    return this.usersService.getAdminStats();
  }

  // 👥 ALL USERS
  @Get('users')
  getUsers() {
    return this.usersService.findAll();
  }

  // 💰 UNPAID USERS
  @Get('unpaid')
  getUnpaid() {
    return this.usersService.getUnpaidUsers();
  }

  // 📧 SEND EMAIL (ONE OR ALL) ✅ CLEAN VERSION
  @Post('send-email')
  sendEmail(
    @Body()
    body: {
      userId?: number;
      email?: string;
      subject: string;
      message: string;
      sendToAll?: boolean;
    },
  ) {
    if (body.sendToAll) {
      return this.usersService.sendEmailToAll(
        body.subject,
        body.message,
      );
    }

    if (body.userId) {
      return this.usersService.sendEmailToUser(
        body.userId,
        body.subject,
        body.message,
      );
    }

    if (body.email) {
      return this.usersService.sendEmailToUser(
        body.email,
        body.subject,
        body.message,
      );
    }

    throw new BadRequestException(
      'Provide userId or email or use sendToAll',
    );
  }

  // 🎁 FREE ACCESS
  @Patch('free-access')
  setFree(@Body() body: { userId: number; value: boolean }) {
    return this.usersService.setFreeAccess(body.userId, body.value);
  }

  // 💲 CUSTOM PRICE
  @Patch('custom-price')
  setPrice(@Body() body: { userId: number; price: number }) {
    return this.usersService.setCustomPrice(body.userId, body.price);
  }

  // 🚫 BAN
  @Patch('ban/:id')
  ban(@Param('id') id: number) {
    return this.usersService.banUser(Number(id));
  }

  // 🔓 UNBAN
  @Patch('unban/:id')
  unban(@Param('id') id: number) {
    return this.usersService.unbanUser(Number(id));
  }

  // 🗑 DELETE
  @Delete('user/:id')
  delete(@Param('id') id: number) {
    return this.usersService.delete(Number(id));
  }
}