import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { LanguageController } from './language.controller';

import { User } from './user.entity';
import { Follow } from './follow.entity';
import { AdminController } from '../admin/admin.controller';

import { JwtStrategy } from '../auth/jwt.strategy';
import { TermsController } from './terms.controller';
import { EmailModule } from '../email/email.module'; // ✅ FIX PATH

@Module({
  imports: [
    // 🔥 DATABASE
    TypeOrmModule.forFeature([
      User,
      Follow,
    ]),

    // 🔥 IMPORT MODULE HERE (NOT inside forFeature)
    EmailModule, // ✅ CORRECT PLACE

    // 🔐 JWT
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '1h' },
    }),
  ],

  controllers: [
    UsersController,
    LanguageController,
    TermsController, // ⚠️ controllers go here
    AdminController,
  ],

  providers: [
    UsersService,
    JwtStrategy,
  ],

  exports: [
    UsersService,
  ],
})
export class UsersModule {}