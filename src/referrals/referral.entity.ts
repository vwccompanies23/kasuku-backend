import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  // 👤 Who invited
  @Column()
  referrerId: number;

  // 👤 Who joined
  @Column()
  referredUserId: number;

  // 🎁 Reward given?
  @Column({ default: false })
  rewardGranted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string;

  @Column({ default: false })
  referralRewardGranted: boolean;
}