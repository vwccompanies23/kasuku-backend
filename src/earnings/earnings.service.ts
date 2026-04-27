import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import PDFDocument from 'pdfkit';

import { Earning } from './earning.entity';
import { User } from '../users/user.entity';
import { ImportService } from './import.service';

import { EmailService } from '../email/email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiService } from './ai.service';


@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(Earning)
    private earningRepo: Repository<Earning>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private emailService: EmailService,

    @InjectQueue('earnings')
    private earningsQueue: Queue,

    private eventEmitter: EventEmitter2,
    private readonly importService: ImportService,
    private readonly aiService: AiService,
  ) {}

  // =========================
  // ⚡ ADD TO QUEUE
  // =========================
  async addEarningJob(data: {
    userId: number;
    amount: number;
    platform: string;
    musicId?: number;
  }) {
    await this.earningsQueue.add('process-earning', data);
  }

  // =========================
  // 💾 SAVE EARNING + REALTIME 🔥
  // =========================
  async saveEarning(data: {
    userId: number;
    amount: number;
    platform: string;
    musicId?: number;
  }) {
    const { userId, amount, platform, musicId } = data;

    const id = Number(userId);
    console.log('🔍 Finding user with ID:', id);

    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      console.log('❌ USER NOT FOUND');
      const allUsers = await this.userRepo.find();
      console.log('📊 ALL USERS IN DB:', allUsers);

      throw new BadRequestException('User not found ❌');
    }

    console.log('✅ USER FOUND:', user.email);

    const month = new Date().toISOString().slice(0, 7);

    const earning = this.earningRepo.create({
      user,
      amount: Number(amount),
      platform,
      month,
      music: musicId ? ({ id: musicId } as any) : undefined,
    });

    await this.earningRepo.save(earning);

    // 💰 UPDATE USER BALANCE
    user.balance = Number((user.balance || 0) + Number(amount));
    await this.userRepo.save(user);

    // 🔔 REALTIME EVENT
    this.eventEmitter.emit('earnings.created', {
      userId: user.id,
      amount: Number(amount),
    });

    // 💸 AUTO PAYOUT TRIGGER
    const summary = await this.getUserSummary(user.id);

    if (summary.total >= 50) {
      console.log('💸 Auto payout triggered');

      this.eventEmitter.emit('payout.trigger', {
        userId: user.id,
      });
    }

    return {
      success: true,
      message: 'Earning saved 💰',
    };
  }

  async queueImport(filePath: string) {
  await this.earningsQueue.add('import-csv', {
    filePath,
  });

  return {
    success: true,
    message: 'CSV import started 🚀',
  };
}

  // =========================
  // 📊 MONTHLY REPORT
  // =========================
  async getMonthlyReport(userId: number, month: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    const earnings = await this.earningRepo.find({
      where: {
        user: { id: userId },
        month,
      },
      relations: ['music'],
    });

    let total = 0;

    const platforms: Record<
      string,
      { total: number; tracks: { title: string; amount: number }[] }
    > = {};

    for (const e of earnings) {
      total += Number(e.amount);

      if (!platforms[e.platform]) {
        platforms[e.platform] = {
          total: 0,
          tracks: [],
        };
      }

      platforms[e.platform].total += Number(e.amount);

      platforms[e.platform].tracks.push({
        title: e.music?.title || 'Unknown',
        amount: Number(e.amount),
      });
    }

    return {
      artist: user?.artistName || 'Artist',
      email: user?.email,
      language: user?.language || 'en',
      month,
      total: Number(total.toFixed(2)),
      platforms,
    };
  }

  // =========================
  // 📄 GENERATE PDF (BRANDED)
  // =========================
async generatePdfReport(userId: number, month: string) {
    const report = await this.getMonthlyReport(userId, month);

    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc
        .fontSize(22)
        .fillColor('#ff003c')
        .text('KASUKU REPORT', { align: 'center' });

      doc.moveDown();

      doc
        .fontSize(14)
        .fillColor('#7c3aed')
        .text(`Artist: ${report.artist}`);

      doc.fillColor('#ffffff').text(`Month: ${report.month}`);
      doc.text(`Total Earnings: $${report.total}`);

      doc.moveDown();

      for (const platform in report.platforms) {
        const p = report.platforms[platform];

        doc.moveDown();
        doc
          .fontSize(16)
          .fillColor('#ff003c')
          .text(platform.toUpperCase());

        doc
          .fontSize(12)
          .fillColor('#ffffff')
          .text(`Total: $${p.total.toFixed(2)}`);

        doc.moveDown(0.5);

        for (const track of p.tracks) {
          doc.text(`• ${track.title} — $${track.amount.toFixed(2)}`);
        }
      }

      doc.moveDown(2);

      doc
        .fontSize(10)
        .fillColor('#7c3aed')
        .text('Powered by Kasuku Platform', { align: 'center' });

      doc.end();
    });
  }

  // =============================
// 📊 SIMPLE REPORT (API FOR UI)
// =============================
async generateReport(userId: number, month: string) {
  const earnings = await this.earningRepo.find({
    where: {
      user: { id: userId },
      month,
    },
  });

  let total = 0;

  const platforms: Record<string, any> = {};

  for (const e of earnings) {
    total += Number(e.amount);

    if (!platforms[e.platform]) {
      platforms[e.platform] = {
        total: 0,
        tracks: {},
      };
    }

    platforms[e.platform].total += Number(e.amount);

    if (!platforms[e.platform].tracks[e.track]) {
      platforms[e.platform].tracks[e.track] = 0;
    }

    platforms[e.platform].tracks[e.track] += Number(e.amount);
  }

  return {
    month,
    total: Number(total.toFixed(2)),
    platforms,
  };
}

  // =========================
  // 📧 SEND REPORT
  // =========================
  async sendMonthlyReport(userId: number, month: string) {
    const report = await this.getMonthlyReport(userId, month);

    if (!report.email) return;

    const pdf = await this.generatePdfReport(userId, month);

    await this.emailService.sendEarningsReport(
      report.email,
      report.artist,
      month,
      pdf,
      report.language,
    );

    return { success: true };
  }

  // =========================
  // 📊 USER SUMMARY
  // =========================
  async getUserSummary(userId: number) {
    const earnings = await this.earningRepo.find({
      where: { user: { id: userId } },
    });

    let total = 0;
    const months: Record<string, number> = {};

    for (const e of earnings) {
      total += Number(e.amount);

      if (!months[e.month]) {
        months[e.month] = 0;
      }

      months[e.month] += Number(e.amount);
    }

    const monthsArray = Object.values(months);

const growth = this.aiService.predictGrowth(monthsArray);
const next = this.aiService.predictNext(monthsArray);

return {
  total: Number(total.toFixed(2)),
  months,
  predictedNext: next,
  growthRate: growth,
};
  }

  // =========================
  // 📊 PLATFORM BREAKDOWN
  // =========================
  async getPlatformBreakdown(userId: number) {
    const earnings = await this.earningRepo.find({
      where: { user: { id: userId } },
    });

    const platforms: Record<string, number> = {};

    for (const e of earnings) {
      if (!platforms[e.platform]) {
        platforms[e.platform] = 0;
      }

      platforms[e.platform] += Number(e.amount);
    }

    return platforms;
  }

  async importCSV(filePath: string) {
  const rows = await this.importService.parseCSV(filePath);

  for (const row of rows) {
    await this.saveEarning({
      userId: 6,
      amount: parseFloat(row['Revenue'] || 0),
      platform: row['Store'] || 'unknown',
    });
  }

  return { success: true };
}

  // =========================
  // ❌ DELETE
  // =========================
  async deleteAllUserEarnings(userId: number) {
    await this.earningRepo.delete({
      user: { id: userId },
    });

    return { success: true };
  }
}