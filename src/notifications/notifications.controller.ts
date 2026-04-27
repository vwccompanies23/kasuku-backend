import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/users.service';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifService: NotificationsService,
    private readonly usersService: UsersService, // ✅ ONLY THIS
  ) {}

  // =====================
  // 📢 BROADCAST TO ALL USERS
  // =====================
  @Post('broadcast')
  async broadcast(@Body('message') message: string) {
    const users = await this.usersService.findAll();
    return this.notifService.broadcast(users, message);
  }

  // =====================
  // 📥 GET MY NOTIFICATIONS
  // =====================
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyNotifications(@GetUser() user: any) {
    return this.notifService.getUserNotifications(user.userId);
  }
}