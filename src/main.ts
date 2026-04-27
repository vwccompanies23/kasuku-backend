import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import * as express from 'express';
import * as bodyParser from 'body-parser';

// 🔥 SOCKET.IO
import { IoAdapter } from '@nestjs/platform-socket.io';

// ✅ Bull Board (BullMQ version)
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      bodyParser: false,
    });

  // =========================
  // 🌍 CORS
  // =========================
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // =========================
  // 🔥 SOCKET.IO
  // =========================
  app.useWebSocketAdapter(new IoAdapter(app));

  // =========================
  // 🔐 STRIPE WEBHOOK
  // =========================
  app.use(
    '/payments/webhook/stripe',
    bodyParser.raw({
      type: 'application/json',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // =========================
  // 📦 NORMAL REQUESTS
  // =========================
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // =========================
  // 📁 STATIC FILES (FIXED)
  // =========================
  const uploadPath = join(__dirname, '..', 'uploads');

  // ✅ ONLY THIS (KEEP)
  app.use('/uploads', express.static(uploadPath));

  // ❌ REMOVED (was causing issues)
  // app.useStaticAssets(uploadPath, {
  //   prefix: '/uploads/',
  // });

  // =========================
  // 🔥 QUEUE DASHBOARD
  // =========================
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const payoutQueue = app.get('BullQueue_payouts');

  createBullBoard({
    queues: [new BullAdapter(payoutQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  // =========================
  // 🚀 START SERVER
  // =========================
  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Queue dashboard: http://localhost:${port}/admin/queues`);
}

bootstrap();