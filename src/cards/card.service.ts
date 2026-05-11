// src/cards/card.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Card } from './card.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private repo: Repository<Card>,
  ) {}

  async saveCard(userId: number, data: any) {
    const last4 = data.number.slice(-4);

    let card = await this.repo.findOne({ where: { userId } });

    if (!card) {
      card = this.repo.create({
        userId,
        last4,
        brand: 'Visa',
        expMonth: data.expMonth,
        expYear: data.expYear,
        cardholderName: data.name,
      });
    } else {
      card.last4 = last4;
      card.expMonth = data.expMonth;
      card.expYear = data.expYear;
      card.cardholderName = data.name;
    }

    return this.repo.save(card);
  }

  async getCard(userId: number) {
    return this.repo.findOne({ where: { userId } });
  }
}