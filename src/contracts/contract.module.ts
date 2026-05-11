// src/contracts/contract.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractAgreement } from './contract.entity';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContractAgreement])],
  providers: [ContractService],
  controllers: [ContractController],
})
export class ContractModule {}