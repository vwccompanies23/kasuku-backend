import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Revenue } from './revenue.entity';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { RevenueGateway } from './revenue.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Revenue]),

    AuthModule,
  ],

  controllers: [RevenueController],

  providers: [
    RevenueService,
    RevenueGateway,
  ],

  exports: [
    RevenueService,
    RevenueGateway,
  ],
})
export class RevenueModule {}