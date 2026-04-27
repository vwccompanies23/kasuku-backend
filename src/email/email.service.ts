import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { adminEmailTemplate } from './templates/admin-email.template';
import { Unsubscribe } from './unsubscribe.entity';
import { Campaign } from './campaign.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from '../i18n/i18n.service';
import { EmailTrack } from './email-track.entity';
import { EmailGateway } from './email.gateway';

@Injectable()
export class EmailService {
  constructor(
    private i18n: I18nService,

    @InjectRepository(Unsubscribe)
    private unsubRepo: Repository<Unsubscribe>,

    @InjectRepository(EmailTrack)
    private trackRepo: Repository<EmailTrack>,
    private gateway: EmailGateway,

    @InjectRepository(Campaign)
    private readonly repo: Repository<Campaign>,
  ) {}

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kasuku.platform@gmail.com',
      pass: 'wblu pmqk shmd aanb',
    },
  });

  // =========================
  // ✅ BASE SEND (UNCHANGED)
  // =========================
  async send(
    to: string,
    subject: string,
    message: string,
    options?: {
      name?: string;
      buttonText?: string;
      buttonLink?: string;
    },
  ) {
    const html = adminEmailTemplate({
      subject,
      message,
      name: options?.name,
      buttonText: options?.buttonText,
      buttonLink: options?.buttonLink,
      unsubscribeLink: `https://kasuku.com/unsubscribe?email=${to}`,
    });

    await this.transporter.sendMail({
      from: '"Kasuku 🎧" <kasuku.platform@gmail.com>',
      to,
      subject,
      html,
    });

    return { success: true };
  }

  // =========================
  // 🔥 MODERN TEMPLATE (NEW)
  // =========================
  private getModernTemplate({
    title,
    artist,
    cover,
    message,
    buttonText,
    buttonLink,
  }: {
    title: string;
    artist: string;
    cover?: string;
    message: string;
    buttonText?: string;
    buttonLink?: string;
  }) {
    return `
      <div style="background:#000;padding:30px;font-family:sans-serif;color:#fff">
        
        <div style="text-align:center;margin-bottom:20px">
          <h1 style="margin:0;background:linear-gradient(90deg,#ff003c,#7c3aed);-webkit-background-clip:text;color:transparent">
            KASUKU
          </h1>
        </div>

        <div style="background:#0a0a0a;padding:20px;border-radius:12px">

          ${
            cover
              ? `<img src="${cover}" style="width:100%;border-radius:10px;margin-bottom:15px" />`
              : ''
          }

          <h2 style="margin:0">${title}</h2>
          <p style="color:#aaa;margin-bottom:20px">${artist}</p>

          <p style="color:#ddd">${message}</p>

          ${
            buttonLink
              ? `
            <a href="${buttonLink}" 
              style="
                display:inline-block;
                margin-top:20px;
                padding:12px 20px;
                background:linear-gradient(90deg,#ff003c,#7c3aed);
                color:#fff;
                text-decoration:none;
                border-radius:8px;
              ">
              ${buttonText || 'View'}
            </a>
          `
              : ''
          }

        </div>

        <div style="margin-top:20px;text-align:center;color:#666;font-size:12px">
          © ${new Date().getFullYear()} Kasuku Platform
        </div>

      </div>
    `;
  }

  // =========================
  // ✅ APPROVED EMAIL
  // =========================
  async sendReleaseApprovedEmail(
    email: string,
    artistName: string,
    title: string,
    cover?: string,
    link?: string,
  ) {
    const html = this.getModernTemplate({
      title,
      artist: artistName,
      cover,
      message: `🎉 Your release has been <b>approved</b> and is being prepared for distribution.`,
      buttonText: 'View Release',
      buttonLink: link,
    });

    await this.transporter.sendMail({
      from: '"Kasuku 🎧" <kasuku.platform@gmail.com>',
      to: email,
      subject: '✅ Release Approved',
      html,
    });
  }

  // =========================
  // ❌ REJECTED EMAIL
  // =========================
  async sendReleaseRejectedEmail(
    email: string,
    artistName: string,
    title: string,
    reason?: string,
  ) {
    const html = this.getModernTemplate({
      title,
      artist: artistName,
      message: `❌ Your release was not approved.<br/><br/>
      ${reason ? `Reason: ${reason}` : 'Please review and upload again.'}`,
    });

    await this.transporter.sendMail({
      from: '"Kasuku 🎧" <kasuku.platform@gmail.com>',
      to: email,
      subject: '❌ Release Rejected',
      html,
    });
  }

  // =========================
  // 🔥 RELEASE LIVE (EXISTING)
  // =========================
  async sendReleaseLiveEmail(
    email: string,
    artistName: string,
    title: string,
    url?: string,
  ) {
    return this.send(
      email,
      '🎉 Your release is LIVE!',
      `
        Your release <b>${title}</b> is now live on all platforms 🚀<br/><br/>
        Artist: <b>${artistName}</b><br/><br/>
        Keep promoting your music 🔥
      `,
      {
        name: artistName,
        buttonText: 'Listen Now',
        buttonLink: url,
      },
    );
  }

  // =========================
  // 📤 SEND TO ALL (RESTORED)
  // =========================
  async sendToAll(subject: string, message: string) {
    const users = ['test@example.com'];

    for (const email of users) {
      const unsub = await this.unsubRepo.findOne({
        where: { email },
      });

      if (unsub) continue;

      const html = adminEmailTemplate({
        subject,
        message,
        email,
      });

      await this.transporter.sendMail({
        to: email,
        subject,
        html,
      });
    }

    return { success: true };
  }

  // =========================
  // 📊 STATS (RESTORED)
  // =========================
  async getStats() {
    return {
      sent: 0,
      opened: 0,
      clicked: 0,
    };
  }

  // =========================
  // 📢 CAMPAIGN (RESTORED)
  // =========================
  async createCampaign(subject: string, message: string) {
    const campaign = this.repo.create({
      subject,
      message,
      createdAt: new Date(),
    });

    return this.repo.save(campaign);
  }

  // =========================
  // 📄 EARNINGS REPORT (RESTORED)
  // =========================
  async sendEarningsReport(
    email: string,
    artistName: string,
    month: string,
    pdfBuffer: Buffer,
    lang: string = 'en',
  ) {
    const title = this.i18n.t(lang, 'email_report_title');
    const greeting = this.i18n.t(lang, 'email_greeting');
    const ready = this.i18n.t(lang, 'email_ready');
    const attached = this.i18n.t(lang, 'email_attached');
    const footer = this.i18n.t(lang, 'email_footer');

    await this.transporter.sendMail({
      from: '"Kasuku 🎧" <kasuku.platform@gmail.com>',
      to: email,
      subject: `${title} - ${month}`,
      html: this.getTemplate(
        title,
        `
        ${greeting} ${artistName},<br/><br/>
        ${ready} <b>${month}</b>.<br/><br/>
        ${attached}<br/><br/>
        🚀<br/>
        <b>${footer}</b>
        `,
      ),
      attachments: [
        {
          filename: `Kasuku-${month}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return { success: true };
  }

  // =========================
  // 🧱 BASIC TEMPLATE (EXISTING)
  // =========================
  private getTemplate(title: string, content: string) {
    return `
      <div style="background:#0f172a;padding:30px;font-family:sans-serif;color:#fff">
        <div style="text-align:center;margin-bottom:20px">
          <h1 style="color:#22c55e;margin:0">KASUKU</h1>
        </div>

        <div style="background:#020617;padding:20px;border-radius:10px">
          <h2 style="color:#22c55e">${title}</h2>
          <p style="color:#e2e8f0">${content}</p>
        </div>

        <div style="margin-top:20px;text-align:center;color:#64748b">
          ©️ ${new Date().getFullYear()} Kasuku Platform
        </div>
      </div>
    `;
  }
}