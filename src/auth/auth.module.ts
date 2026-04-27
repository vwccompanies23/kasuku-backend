import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt.guard';

import { User } from '../users/user.entity';
import { ReferralModule } from '../referrals/referral.module'; // 🔥 ADD

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    JwtModule.registerAsync({
  useFactory: () => ({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '7d' },
  }),
}),

    ReferralModule, // 🔥 THIS IS THE FIX
  ],

  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
  ],

  controllers: [AuthController],

  exports: [
    JwtAuthGuard,
    JwtModule,
  ],
})
export class AuthModule {}