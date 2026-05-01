import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

// ✅ IMPORT THIS
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    // 🔥 THIS FIXES YOUR ERROR
    JwtModule.register({}),
  ],
  controllers: [TaxController],
})
export class TaxModule {}