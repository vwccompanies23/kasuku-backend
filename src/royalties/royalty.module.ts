import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // ✅ ADD THIS

import { Royalty } from './royalty.entity';
import { User } from '../users/user.entity';

import { RoyaltyService } from './royalty.service';
import { RoyaltyController } from './royalty.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Royalty, User]),

    // ✅ ADD THIS (FIXES YOUR ERROR)
    JwtModule.register({
      secret: 'secret', // ⚠️ use same secret as auth module
      signOptions: { expiresIn: '1d' },
    }),
  ],

  providers: [RoyaltyService],
  controllers: [RoyaltyController],
  exports: [RoyaltyService],
})
export class RoyaltiesModule {}