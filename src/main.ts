import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
  path: join(__dirname, '../.env'),
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
      {
        bodyParser: false,
      },
    );

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://kasukuu.com',
      'https://www.kasukuu.com',
      'https://kasuku-dashboard-eccrlh7qz-vwccompanies23s-projects.vercel.app',
    ],
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useStaticAssets(
    join(__dirname, '..', 'uploads'),
    {
      prefix: '/uploads/',
    },
  );

  app.use(
    '/payments/webhook',
    bodyParser.raw({
      type: '*/*',
      verify: (
        req: any,
        _res,
        buf,
      ) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(bodyParser.json());

  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  app.use(
    '/uploads',
    express.static('uploads'),
  );

  const port =
    process.env.PORT || 3000;

  await app.listen(port);

  console.log(
    `🚀 Server running on port ${port}`,
  );
}

bootstrap();