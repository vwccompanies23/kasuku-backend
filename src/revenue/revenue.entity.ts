import { Release } from '../releases/release.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity()
export class Revenue {
  @PrimaryGeneratedColumn()
  id: number;

  // 👤 USER RELATION
  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: number;

  // 🎵 MUSIC RELATION
  @ManyToOne(() => Release, { nullable: true })
  music: Release;

  // 💰 TOTAL AMOUNT
  @Column('float')
  amount: number;

  // 📊 PERCENTAGE (admin cut)
  @Column('float')
  percentage: number;

  // 💰 ADMIN SHARE
  @Column('float')
  adminShare: number;

  // 💰 USER SHARE
  @Column('float')
  userShare: number;

  // 🕒 CREATED DATE (for charts)
  @CreateDateColumn()
  createdAt: Date;
}