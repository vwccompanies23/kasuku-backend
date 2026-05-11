// src/cards/card.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  last4: string;

  @Column()
  brand: string;

  @Column()
  expMonth: string;

  @Column()
  expYear: string;

  @Column()
  cardholderName: string;
}