import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Payout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  amount: number;

  @Column()
  method: 'paypal' | 'stripe';

  @Column({ nullable: true })
  email: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ nullable: true })
  externalId: string; // PayPal batch id or Stripe id

  @CreateDateColumn()
  createdAt: Date;
}