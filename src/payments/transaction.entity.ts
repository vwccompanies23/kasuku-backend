import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  // 🔗 USER RELATION
  @ManyToOne(() => User, (user) => user.id)
  user: User;

  // 💰 AMOUNT
  @Column('float')
  amount: number;

  // 🔒 STRIPE EVENT (DEPOSITS)
  @Column({ nullable: true, unique: true })
  stripeEventId: string;

  // 🔒 STRIPE PAYOUT (WITHDRAW)
  @Column({ nullable: true, unique: true })
  stripePayoutId: string;

  // 🧾 TYPE
  @Column()
  type: string; // 'topup' | 'withdraw' | 'subscription'

  // 📊 STATUS
  @Column({ default: 'completed' })
  status: string;

  // 🌍 SOURCE
  @Column({ nullable: true })
  source: string;

  // 🔥 ADD THIS
@Column({ nullable: true })
releaseId: number;

  // 📅 CREATED DATE
  @CreateDateColumn()
  createdAt: Date;
}