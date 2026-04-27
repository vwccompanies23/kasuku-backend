import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';

// 🔥 NEW
import { OnEvent } from '@nestjs/event-emitter';

import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  private transporter;

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // =====================
  // 🎨 EMAIL TEMPLATE (FIXED + UPGRADED)
  // =====================
  private buildTemplate(title: string, message: string) {
    return `
    <div style="background:#0a0a0a;padding:40px;font-family:sans-serif;color:#fff">
      
      <div style="max-width:500px;margin:auto;background:#141414;border-radius:16px;padding:30px;box-shadow:0 0 25px rgba(124,58,237,0.4)">
        
        <div style="text-align:center;margin-bottom:20px">
          <!-- ✅ YOUR REAL LOGO -->
          <img src="https://i.imgur.com/mdZGEjd.png" width="80" style="margin-bottom:10px;" />
          
          <h1 style="
            margin-top:5px;
            font-size:20px;
            background:linear-gradient(90deg,#ff003c,#7c3aed);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
          ">
            Kasuku
          </h1>
        </div>

        <h2 style="margin-bottom:10px">${title}</h2>

        <p style="color:#aaa;font-size:14px;line-height:1.6">
          ${message}
        </p>

        <div style="text-align:center;margin-top:25px">
          <a href="http://localhost:3000/dashboard"
             style="
              padding:12px 20px;
              border-radius:10px;
              text-decoration:none;
              color:#fff;
              background:linear-gradient(90deg,#ff003c,#7c3aed);
              font-weight:bold;
              display:inline-block;
             ">
            Open Dashboard 🚀
          </a>
        </div>

        <p style="margin-top:30px;font-size:12px;color:#666;text-align:center">
          © ${new Date().getFullYear()} Kasuku. All rights reserved.
        </p>
      </div>
    </div>
    `;
  }

  // =====================
  // 🔔 CREATE SINGLE
  // =====================
  async create(userId: number, message: string) {
    const notif = this.notifRepo.create({
      message,
      user: { id: userId } as any,
    });

    return this.notifRepo.save(notif);
  }

  // =====================
  // 📢 BROADCAST
  // =====================
  async broadcast(users: { id: number }[], message: string) {
    const notifications = users.map((u) =>
      this.notifRepo.create({
        message,
        user: { id: u.id } as any,
      }),
    );

    return this.notifRepo.save(notifications);
  }

  // =====================
  // 📧 SEND EMAIL (UPGRADED SAFE)
  // =====================
  async sendEmail(to: string, subject: string, text: string) {
    if (!to) return;

    try {
      const html = this.buildTemplate(subject, text);

      await this.transporter.sendMail({
        from: '"Kasuku 🎵" <your_email@gmail.com>',
        to,
        subject,
        text: text || 'Notification from Kasuku',
        html,
      });

      console.log(`📧 Email sent to ${to}`);
    } catch (err) {
      console.error('Email error:', err);
    }
  }

  // =====================
  // 📧 EMAIL ALL USERS
  // =====================
  async sendEmailToAll(users: { email: string }[], message: string) {
    for (const user of users) {
      if (!user.email) continue;

      await this.sendEmail(
        user.email,
        '📢 Kasuku Update',
        message,
      );
    }
  }

  // =====================
  // 🔥 EARNINGS EMAIL
  // =====================
  async sendEarningsEmail(user: any, amount: number) {
    if (!user?.email) return;

    await this.sendEmail(
      user.email,
      '💰 New Earnings Received',
      `You earned $${amount} on Kasuku 🎉`,
    );
  }

  // =====================
  // 🔥 RELEASE LIVE EMAIL
  // =====================
  async sendReleaseLiveEmail(user: any, title: string) {
    if (!user?.email) return;

    await this.sendEmail(
      user.email,
      '🎵 Your Release is LIVE!',
      `"${title}" is now live on streaming platforms 🚀`,
    );
  }

  // =====================
  // 📥 GET USER NOTIFS
  // =====================
  async getUserNotifications(userId: number) {
    return this.notifRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  // =====================
  // ✅ MARK AS READ
  // =====================
  async markAsRead(id: number) {
    await this.notifRepo.update(id, { isRead: true });
    return { message: 'Notification marked as read' };
  }

  // =====================
  // 🔥 EVENT: EARNINGS CREATED
  // =====================
  @OnEvent('earnings.created')
  async handleEarningsEvent(payload: {
    userId: number;
    email: string;
    amount: number;
  }) {
    const { userId, email, amount } = payload;

    await this.create(
      userId,
      `💰 You earned $${amount} on Kasuku`,
    );

    await this.sendEmail(
      email,
      '💰 New Earnings',
      `You received $${amount} in earnings.`,
    );
  }
}