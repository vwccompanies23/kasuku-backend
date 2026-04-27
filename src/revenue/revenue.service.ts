import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Revenue } from './revenue.entity';
import { RevenueGateway } from './revenue.gateway';
import { timestamp } from 'rxjs';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(Revenue)
    private repo: Repository<Revenue>,

    private gateway: RevenueGateway,
  ) {}

  // =========================
  // 💰 CREATE REVENUE ENTRY
  // =========================
  async create(
    userId: number,
    amount: number,
    percentage: number,
    musicId?: number,
  ) {
    const safeAmount = Number(amount || 0);
    const safePercentage = Number(percentage || 0);

    const adminShare = (safeAmount * safePercentage) / 100;
    const userShare = safeAmount - adminShare;

    await this.repo.save({
      user: { id: userId } as any,
      userId, // ✅ keep both for safety
      amount: safeAmount,
      percentage: safePercentage,
      adminShare,
      userShare,
      music: musicId ? ({ id: musicId } as any) : undefined,
    });

    // 🔥 LIVE UPDATE (REAL-TIME DASHBOARD)
     this.gateway.sendUpdate({
        amount: safeAmount,
        userId,
        musicId,
     });

    return { success: true };
  }

  // =========================
  // 📊 ADMIN DETAILED STATS
  // =========================
  async getAdminStatsDetailed() {
    const all = await this.repo.find({
      relations: ['music', 'user'],
    });

    let totalRevenue = 0;
    let totalPlatform = 0;

    const byUser: Record<number, number> = {};
    const bySong: Record<string, number> = {};

    for (const r of all) {
      const amount = Number(r.amount || 0);
      const admin = Number(r.adminShare || 0);

      totalRevenue += amount;
      totalPlatform += admin;

      // 👤 USER AGGREGATION
      const uid = (r as any).user?.id || r.userId;

      if (!byUser[uid]) byUser[uid] = 0;
      byUser[uid] += amount;

      // 🎵 SONG AGGREGATION
      if (r.music?.title) {
        if (!bySong[r.music.title]) bySong[r.music.title] = 0;
        bySong[r.music.title] += amount;
      }
    }

    const topUsers = Object.entries(byUser)
      .map(([userId, total]) => ({
        userId: Number(userId),
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topSongs = Object.entries(bySong)
      .map(([title, total]) => ({
        title,
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalRevenue,
      totalPlatform,
      totalUsers: totalRevenue - totalPlatform,
      totalRecords: all.length,
      topUsers,
      topSongs,
    };
  }

  // =========================
  // 📊 MONTHLY CHART DATA
  // =========================
  async getMonthlyRevenue() {
    const all = await this.repo.find();

    const map: Record<string, number> = {};

    for (const r of all) {
      const date = r.createdAt ? new Date(r.createdAt) : new Date();

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;

      if (!map[key]) map[key] = 0;

      map[key] += Number(r.amount || 0);
    }

    return Object.entries(map).map(([month, total]) => ({
      month,
      total,
    }));
  }

  // =========================
  // 📊 ADMIN TOTAL EARNINGS
  // =========================
  async getAdminStats() {
    const all = await this.repo.find();

    const totalPlatform = all.reduce(
      (sum, r) => sum + Number(r.adminShare || 0),
      0,
    );

    const totalUsers = all.reduce(
      (sum, r) =>
        sum +
        (Number(r.amount || 0) - Number(r.adminShare || 0)),
      0,
    );

    return {
      totalPlatform,
      totalUsers,
      totalRecords: all.length,
    };
  }

  // =========================
  // 👤 USER REVENUE
  // =========================
  async getUserRevenue(userId: number) {
    return this.repo.find({
      where: { userId },
      relations: ['music'],
    });
  }
}