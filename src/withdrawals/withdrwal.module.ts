import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Withdrawal } from './withdrawal.entity';
import { User } from '../users/user.entity';

import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';

// 🔥 IMPORT THIS
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Withdrawal, User]),

    AuthModule, // ✅ THIS FIXES EVERYTHING
  ],
  providers: [WithdrawalService],
  controllers: [WithdrawalController],
})
export class WithdrawalModule {}