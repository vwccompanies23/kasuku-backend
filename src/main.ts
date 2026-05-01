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

  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(
    '/payments/webhook/stripe',
    bodyParser.raw({
      type: 'application/json',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const uploadPath = join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadPath));

  // 🔥 SAFE QUEUE INIT
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  let payoutQueue: any;

  try {
    payoutQueue = app.get('BullQueue_payouts');
  } catch (err) {
    console.log('⚠️ Queue not available (Redis disabled)');
  }

  if (payoutQueue) {
    createBullBoard({
      queues: [new BullAdapter(payoutQueue)],
      serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());
  }

  // ✅ IMPORTANT
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();