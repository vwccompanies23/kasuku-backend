import {
  Controller,
  Get,
  Req,
  Param,
  Delete,
  Query,
  Res,
  UseGuards,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { EarningsService } from './earnings.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  // =========================
  // 📥 IMPORT CSV
  // =========================
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(@UploadedFile() file: Express.Multer.File) {
    return this.earningsService.queueImport(file.path);
  }

  // =========================
  // 💰 CREATE EARNING
  // =========================
  @Post()
  async create(@Body() body: any) {
    return this.earningsService.saveEarning({
      userId: Number(body.userId),
      amount: Number(body.amount),
      platform: body.platform,
      musicId: body.musicId,
    });
  }

  // =========================
  // 📊 GET ALL / SUMMARY
  // =========================
  @Get()
  async getAll(@Query('userId') userId: number) {
    return this.earningsService.getUserSummary(Number(userId));
  }

  // =========================
  // 📊 MONTHLY REPORT
  // =========================
  @Get('report/:month')
  async getMonthlyReport(@Req() req: any, @Param('month') month: string) {
    const userId = req.user?.id || req.user?.userId || 1;
    return this.earningsService.getMonthlyReport(userId, month);
  }


  // =========================
  // 📄 PDF DOWNLOAD
  // =========================
  @Get('report/pdf/:month')
  async downloadPdf(
    @Req() req: any,
    @Param('month') month: string,
    @Res() res: Response,
  ) {
    const userId = req.user?.id || req.user?.userId || 1;

    const pdfBuffer = await this.earningsService.generatePdfReport(
      userId,
      month,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=earnings-${month}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  // =========================
  // 📊 SUMMARY
  // =========================
  @Get('summary')
  async getSummary(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || 1;
    return this.earningsService.getUserSummary(userId);
  }

  // =========================
  // 📊 PLATFORMS
  // =========================
  @Get('platforms')
  async getPlatforms(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || 1;
    return this.earningsService.getPlatformBreakdown(userId);
  }

  // =========================
  // ❌ RESET
  // =========================
  @Delete('reset')
  async resetUserEarnings(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || 1;
    return this.earningsService.deleteAllUserEarnings(userId);
  }
}