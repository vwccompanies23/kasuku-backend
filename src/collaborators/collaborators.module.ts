import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';

import { Release } from '../releases/release.entity';
import { User } from '../users/user.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Release, User]),
    PaymentsModule,
  ],
  providers: [CollaboratorsService],
  controllers: [CollaboratorsController],
})
export class CollaboratorsModule {}