import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  UnauthorizedException,
  Req,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { ReleasesService } from './releases.service';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

import { UsersService } from '../users/users.service';
import { SubscriptionGuard } from '../common/guards/subscription.guard';

@Controller('releases')
export class ReleasesController {
  constructor(
    private readonly releasesService: ReleasesService,
    private readonly usersService: UsersService,
  ) {}

  @Post(':id/distribute')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  async submit(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    const userId = Number(user?.userId);

    if (!userId) {
      throw new UnauthorizedException(
        'Invalid user ❌',
      );
    }

    return this.releasesService.submitForDistribution(
      Number(id),
      userId,
    );
  }

  @Post('submit/:id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  async submitRelease(
    @Param('id') id: string,
    @Req() req,
  ) {
    const userId = req.user.userId;

    return this.releasesService.submitForDistribution(
      Number(id),
      userId,
    );
  }

  @Post('upload-full')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'cover',
          maxCount: 1,
        },
        {
          name: 'tracks',
          maxCount: 50,
        },
      ],
      {
        storage: diskStorage({
          destination: './uploads',

          filename: (
            req,
            file,
            cb,
          ) => {
            const unique =
              Date.now() +
              '-' +
              file.originalname;

            cb(null, unique);
          },
        }),
      },
    ),
  )
  async uploadFullRelease(
    @UploadedFiles()
    files: {
      cover?: Express.Multer.File[];
      tracks?: Express.Multer.File[];
    },

    @Body()
    body: any,

    @GetUser()
    user: any,
  ) {
    console.log(
      '📦 RAW BODY:',
      body,
    );

    const userId = Number(
      user?.userId,
    );

    if (!userId) {
      throw new UnauthorizedException(
        'Invalid user ❌',
      );
    }

    const cover =
      files.cover?.[0];

    const tracks =
      files.tracks || [];

    if (!tracks.length) {
      throw new BadRequestException(
        'No tracks uploaded ❌',
      );
    }

    let platforms: any[] = [];

    if (body.platforms) {
      try {
        platforms =
          typeof body.platforms ===
          'string'
            ? JSON.parse(
                body.platforms,
              )
            : body.platforms;
      } catch (err) {
        console.error(
          '❌ Platform parse error:',
          err,
        );

        platforms = [];
      }
    }

    console.log(
      '✅ PARSED PLATFORMS:',
      platforms,
    );

    let trackTitles: string[] = [];

if (body.trackTitles) {
  try {
    trackTitles =
      typeof body.trackTitles === 'string'
        ? JSON.parse(body.trackTitles)
        : body.trackTitles;
  } catch (err) {
    console.log(
      '❌ Track titles parse error:',
      err,
    );

    trackTitles = [];
  }
}

    return this.releasesService.createFullRelease(
      {
        body: {
          ...body,
          platforms,
        },

        cover,
        tracks,
        trackTitles,
        userId,
      },
    );
  }

  @Post(':id/upload-track')
  @UseGuards(
    JwtAuthGuard,
    SubscriptionGuard,
  )
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'cover',
          maxCount: 1,
        },
        {
          name: 'track',
          maxCount: 1,
        },
      ],
      {
        storage: diskStorage({
          destination: './uploads',

          filename: (
            req,
            file,
            cb,
          ) => {
            const unique =
              Date.now() +
              '-' +
              file.originalname;

            cb(null, unique);
          },
        }),
      },
    ),
  )
  uploadToRelease(
    @Param('id')
    id: string,

    @UploadedFiles()
    files: {
      cover?: Express.Multer.File[];
      track?: Express.Multer.File[];
    },

    @Body()
    body: any,

    @GetUser()
    user: any,
  ) {
    const userId = Number(
      user?.userId,
    );

    if (!userId) {
      throw new UnauthorizedException(
        'Invalid user ❌',
      );
    }

    const cover =
      files.cover?.[0];

    const track =
      files.track?.[0];

    if (!track) {
      throw new BadRequestException(
        'Track required ❌',
      );
    }

    return this.releasesService.uploadTrackToRelease(
      Number(id),
      {
        cover,
        track,

        body: {
          ...body,
          userId,
          releaseId:
            Number(id),
        },
      },
    );
  }

  @Get()
  findAll() {
    return this.releasesService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyReleases(
    @GetUser() user: any,
  ) {
    const userId = Number(
      user?.userId,
    );

    if (!userId) {
      throw new UnauthorizedException(
        'Invalid user ❌',
      );
    }

    return this.releasesService.getUserReleases(
      userId,
    );
  }

  @Get('slug/:slug')
  getBySlug(
    @Param('slug')
    slug: string,
  ) {
    return this.releasesService.findBySlug(
      slug,
    );
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  getPending() {
    return this.releasesService.getPendingReleases();
  }

  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard)
  approve(
    @Param('id')
    id: string,
  ) {
    return this.releasesService.approveRelease(
      Number(id),
    );
  }

  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard)
  reject(
    @Param('id')
    id: string,

    @Body()
    body: any,
  ) {
    return this.releasesService.rejectRelease(
      Number(id),
      body.reason,
    );
  }

  @Get(':id')
  getPublicRelease(
    @Param('id')
    id: string,
  ) {
    return this.releasesService.findOne(
      Number(id),
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'cover',
          maxCount: 1,
        },
        {
          name: 'file',
          maxCount: 1,
        },
      ],
      {
        storage: diskStorage({
          destination: './uploads',

          filename: (
            req,
            file,
            cb,
          ) => {
            const unique =
              Date.now() +
              '-' +
              file.originalname;

            cb(null, unique);
          },
        }),
      },
    ),
  )
  async updateRelease(
    @Param('id')
    id: string,

    @UploadedFiles()
    files: {
      cover?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },

    @Body()
    body: any,

    @GetUser()
    user: any,
  ) {
    const userId = Number(
      user?.userId,
    );

    if (!userId) {
      throw new UnauthorizedException(
        'Invalid user ❌',
      );
    }

    return this.releasesService.updateRelease(
      Number(id),
      {
        ...body,

        userId,

        cover:
          files.cover?.[0]
            ? `/uploads/${files.cover[0].filename}`
            : null,

        audio:
          files.file?.[0]
            ? `/uploads/${files.file[0].filename}`
            : null,
      },
    );
  }
}