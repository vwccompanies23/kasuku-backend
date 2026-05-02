// 🔥 ADD THIS AT THE VERY TOP
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({
  path: join(__dirname, '../.env'), // ✅ correct path to backend/.env
});


// ⬇️ KEEP EVERYTHING ELSE THE SAME
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { initCloudinary } from './config/cloudinary.config';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  // 🔥 NOW this will work
  initCloudinary();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
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

  app.use('/uploads', express.static('uploads'));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();