import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

import { AccountType } from './account-type.enum';
import { Release } from '../releases/release.entity';
import { Follow } from './follow.entity';
import { Payout } from 'src/payouts/payout.entity';
import { Music } from '../music/music.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.SOLO,
  })
  accountType: AccountType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: 'New Artist' })
  artistName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: true })
  referralEnabled: boolean;

  // =========================
// 🎁 REFERRAL SYSTEM (NEW)
// =========================
  @Column({ unique: true, nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string; // stores referralCode

  @Column({ default: false })
  referralRewardGranted: boolean;

  @Column({ nullable: true })
  customSubscriptionPrice: number;

  // 🌐 SOCIALS
  @Column({ nullable: true }) website: string;
  @Column({ nullable: true }) instagram: string;
  @Column({ nullable: true }) twitter: string;
  @Column({ nullable: true }) youtube: string;

  // 🎧 PLATFORM IDS
  @Column({ nullable: true }) spotifyArtistId: string;
  @Column({ nullable: true }) appleMusicId: string;
  @Column({ nullable: true }) amazonMusicId: string;
  @Column({ nullable: true }) youtubeChannelId: string;
  @Column({ nullable: true }) tidalId: string;
  @Column({ nullable: true }) deezerId: string;

  // 🔥 ADMIN CONTROL FLAGS
  @Column({ default: false })
  isFreeOverride: boolean;

  @Column({ type: 'float', default: 0 })
  platformFeePercent: number;

  @Column({ type: 'float', default: 0 })
  distributorFeePercent: number;

  @Column({ default: false })
  platformIdsVerified: boolean;

  // 💰 FINANCE
  @Column({ default: false })
  noSubscriptionFee: boolean;

  @Column('float', { default: 0 })
  balance: number;

  @Column({ nullable: true })
  stripeAccountId: string;

  @Column({ default: false })
  chargesEnabled: boolean;

  // =========================
  // 🔥 SUBSCRIPTION SYSTEM (IMPROVED)
  // =========================

  @Column({
    default: 'FREE', // ✅ important default
  })
  plan: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  billingCycle: string;

  @Column({
    default: 'inactive', // inactive | active | canceled
  })
  subscriptionStatus: string;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  @Column({ nullable: true })
  subscriptionId?: string;

  @Column({ default: false })
  subscriptionActive: boolean;

  @Column({ default: false })
  isManaged: boolean;

  @Column({ default: 40 })
  revenuePercentage: number;

  @Column({ default: false })
  taxCompleted: boolean;

  @Column({ nullable: true })
  taxFullName: string;

  @Column({ nullable: true })
  taxCountry: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ default: false })
  taxVerified: boolean;

  @Column({ default: false })
  payoutOnboardingCompleted: boolean;

  // =========================
  // 🔗 RELATIONS
  // =========================
  @OneToMany(() => Release, (release) => release.user)
  releases: Release[];

  @OneToMany(() => Music, (music) => music.user)
  music: Music[];

  // =========================
  // 📜 TERMS & AGREEMENT
  // =========================
  @Column({ default: false })
  acceptedTerms: boolean;

  @Column({ default: false })
  acceptedDistributionAgreement: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ default: 'en' })
  language: string;

  @OneToMany(() => Follow, (f) => f.follower)
  following: Follow[];

  @OneToMany(() => Follow, (f) => f.following)
  followers: Follow[];

  @OneToMany(() => Payout, (payout) => payout.user)
  payouts: Payout[];
}