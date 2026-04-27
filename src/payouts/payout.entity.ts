import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity()
export class Payout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  amount: number;

  // =========================
  // 💳 METHOD DATA
  // =========================
  @Column({ nullable: true })
  method: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  stripeAccountId: string;

  // =========================
  // 🔒 IDEMPOTENCY (CRITICAL)
  // =========================
  @Index({ unique: true })
  @Column({ nullable: true })
  idempotencyKey: string;

  // =========================
  // 🔒 PROCESS LOCK
  // =========================
  @Column({ default: false })
  locked: boolean;

  // =========================
  // 🔁 RETRY TRACKING
  // =========================
  @Column({ default: 0 })
  retryCount: number;

  // =========================
  // 📊 STATUS CONTROL
  // =========================
  @Index()
  @Column({ default: 'pending' })
  status: string;
  /**
   * pending → processing → completed
   *                     → failed
   *                     → rejected
   */

  // =========================
  // 💸 PROVIDER IDS
  // =========================
  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true })
  externalId: string;

  // =========================
  // 👤 USER RELATION
  // =========================
  @ManyToOne(() => User)
  user: User;

  @Index()
  @Column()
  userId: number;

  // =========================
  // ⏱ TIMESTAMPS
  // =========================
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}