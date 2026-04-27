import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { AccountType } from './account-type.enum';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =====================
  // ✅ CREATE USER
  // =====================
  @Post()
  createUser(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('accountType') accountType: AccountType,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Missing fields ❌');
    }

    return this.usersService.createUser(email, password, accountType);
  }

  // =====================
  // 🔐 LOGIN
  // =====================
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Missing credentials ❌');
    }

    return this.usersService.login(body.email, body.password);
  }

  // =====================
  // 👤 UPDATE PROFILE
  // =====================
  @UseGuards(JwtAuthGuard)
  @Post('update')
  updateProfile(@GetUser() user: any, @Body() body: any) {
    const userId = Number(user?.userId);

    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.usersService.updateProfile(userId, body);
  }

  // =====================
  // 🖼 UPLOAD AVATAR
  // =====================
  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    const userId = Number(user?.userId);

    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded ❌');
    }

    const fileUrl = `http://localhost:3000/uploads/avatars/${file.filename}`;

    await this.usersService.updateProfile(userId, {
      avatar: fileUrl,
    });

    return {
      message: 'Avatar uploaded ✅',
      url: fileUrl,
    };
  }

  // =====================
  // 👤 GET CURRENT USER
  // =====================
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser() user: any) {
    const userId = Number(user?.userId);

    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.usersService.findById(userId);
  }

  // =====================
  // 💳 STRIPE STATUS (NEW)
  // =====================
  @UseGuards(JwtAuthGuard)
  @Get('stripe-status')
 async getStripeStatus(@GetUser() user: any) {
  const userId = Number(user?.userId);

  if (!userId || isNaN(userId)) {
    throw new UnauthorizedException('Invalid token');
  }

  return this.usersService.getStripeStatus(userId);
}

  // =====================
  // ➕ FOLLOW USER
  // =====================
  @UseGuards(JwtAuthGuard)
  @Post('follow/:id')
  follow(@Param('id') id: string, @GetUser() user: any) {
    const targetId = Number(id);

    if (!targetId || isNaN(targetId)) {
      throw new BadRequestException('Invalid user ID ❌');
    }

    return this.usersService.followUser(user.userId, targetId);
  }

  // =====================
  // ❌ UNFOLLOW USER
  // =====================
  @UseGuards(JwtAuthGuard)
  @Post('unfollow/:id')
  unfollow(@Param('id') id: string, @GetUser() user: any) {
    const targetId = Number(id);

    if (!targetId || isNaN(targetId)) {
      throw new BadRequestException('Invalid user ID ❌');
    }

    return this.usersService.unfollowUser(user.userId, targetId);
  }

  // =====================
  // 🌍 PUBLIC PROFILE
  // =====================
  @Get(':id/profile')
  getPublicProfile(@Param('id') id: string) {
    const userId = Number(id);

    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID ❌');
    }

    return this.usersService.getPublicProfile(userId);
  }

  // =====================
  // 🔐 ADMIN
  // =====================
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@GetUser() user: any) {
    if (!user?.isAdmin) {
      throw new UnauthorizedException('Access denied ❌');
    }

    return this.usersService.findAll();
  }

  // =====================
  // 👤 GET USER BY ID
  // =====================
  @Get(':id')
  findOne(@Param('id') id: string) {
    const userId = Number(id);

    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid ID ❌');
    }

    return this.usersService.findById(userId);
  }
}