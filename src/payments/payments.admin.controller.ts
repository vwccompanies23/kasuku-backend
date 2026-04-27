import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';

import { StripeService } from './stripe.service';
import { UsersService } from '../users/users.service';

@Controller('payments/admin')
export class PaymentsAdminController {
  constructor(
    private stripeService: StripeService,
    private usersService: UsersService,
  ) {}

  // =========================
  // 🔗 CONNECT STRIPE
  // =========================
  @Post('connect')
  @UseGuards(JwtAuthGuard)
  async connect(@Req() req: any) {
    const user = req.user;

    if (!user) {
      return { error: 'Unauthorized ❌' };
    }

    const account =
      await this.stripeService.createConnectedAccount();

    await this.usersService.update(user.userId, {
      stripeAccountId: account.id,
    });

    const link =
      await this.stripeService.createOnboardingLink(
        account.id,
      );

    return { url: link.url };
  }

  // =========================
  // 👥 GET ALL USERS
  // =========================
  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllUsers() {
    const users = await this.usersService.findAll();

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      artistName: u.artistName,
      plan: u.plan,
      subscriptionStatus: u.subscriptionStatus,
      balance: u.balance,
      isAdmin: u.isAdmin,
      isActive: u.isActive,
      noSubscriptionFee: u.noSubscriptionFee,
    }));
  }

  // =========================
  // 📊 STATS
  // =========================
  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    const users = await this.usersService.findAll();

    const totalUsers = users.length;

    const paidUsers = users.filter(
      (u) => u.subscriptionStatus === 'active',
    ).length;

    const freeUsers = totalUsers - paidUsers;

    return {
      totalUsers,
      paidUsers,
      freeUsers,
    };
  }

  // =========================
  // 💳 SUBSCRIPTIONS
  // =========================
  @Get('subscriptions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getSubscriptions() {
    const users = await this.usersService.findAll();

    return users
      .filter((u) => u.subscriptionStatus === 'active')
      .map((u) => ({
        email: u.email,
        plan: u.plan,
      }));
  }

  // =========================
  // 💰 REVENUE
  // =========================
  @Get('revenue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getRevenue() {
    const revenue = await this.stripeService.getTotalRevenue();

    const users = await this.usersService.findAll();

    const paidUsers = users.filter(
      (u) => u.subscriptionStatus,
    ).length;

    return {
      totalRevenue: revenue.totalRevenue,
      paymentsCount: revenue.count,
      paidUsers,
    };
  }

  // =========================
  // 🚫 BAN USER
  // =========================
  @Post('ban/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async banUser(@Param('id') id: string) {
    return this.usersService.banUser(Number(id));
  }

  // =========================
  // ✅ UNBAN USER
  // =========================
  @Post('unban/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async unbanUser(@Param('id') id: string) {
    return this.usersService.unbanUser(Number(id));
  }

  // =========================
  // 🎁 GIVE FREE ACCESS
  // =========================
  @Post('free-on/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async giveFreeAccess(@Param('id') id: string) {
    return this.usersService.update(Number(id), {
      noSubscriptionFee: true,
      subscriptionStatus: 'active',
    });
  }

  // =========================
  // 💰 REMOVE FREE ACCESS
  // =========================
  @Post('free-off/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async removeFreeAccess(@Param('id') id: string) {
    return this.usersService.update(Number(id), {
      noSubscriptionFee: false,
    });
  }

  // =========================
  // 🔥 FORCE PLAN (UPGRADED)
  // =========================
  @Post('set-plan/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setPlan(
    @Param('id') id: string,
    @Body() body: { plan: string },
  ) {
    const plan = body.plan?.trim().toLowerCase();

    const allowedPlans = ['free', 'solo', 'artists', 'pro'];

    if (!allowedPlans.includes(plan)) {
      throw new BadRequestException('Invalid plan ❌');
    }

    const user = await this.usersService.findOne(Number(id));

    if (!user) {
      throw new NotFoundException('User not found ❌');
    }

    await this.usersService.update(Number(id), {
      plan,
      subscriptionStatus: plan !== 'free',
    });

    return {
      success: true,
      message: `Plan updated to ${plan} 🚀`,
    };
  }
}