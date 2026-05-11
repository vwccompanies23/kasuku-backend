import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractAgreement } from './contract.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractAgreement)
    private repo: Repository<ContractAgreement>,
  ) {}

  async agree(userId: number, fullName: string, ip: string, ua: string) {
    const existing = await this.repo.findOne({ where: { userId } });

    if (existing) return existing;

    return this.repo.save({
      userId,
      fullName,
      ipAddress: ip,
      userAgent: ua,
    });
  }

  async hasAgreed(userId: number) {
    return this.repo.findOne({ where: { userId } });
  }
}