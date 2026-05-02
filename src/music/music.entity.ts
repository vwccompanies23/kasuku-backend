import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Release } from '../releases/release.entity';

@Entity()
export class Music {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'float', default: 0 })
  commisionRate: number;

  // =========================
  // 🖼️ COVER
  // =========================
  @Column({ type: 'text', nullable: true })
  coverUrl: string | null;

  @Column({ nullable: true })
bitrate: number;

@Column({ nullable: true })
fileSize: number;

@Column({ nullable: true })
loudness: number;

@Column({ nullable: true })
hash: string;

@Column({ default: false })
isDuplicate: boolean;

@Column('simple-array', { nullable: true })
issues: string[];

  // =========================
  // 🎵 RELEASE INFO
  // =========================
  @Column({ type: 'text', nullable: true })
  type: string | null;

  @Column({ type: 'text', nullable: true })
  releaseDate: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  isrc: string | null;

  @Column({ type: 'text', nullable: true })
  upc: string | null;

  @Column('simple-array', { nullable: true })
  platforms: string[];

  @Column({ default: 'instant' })
  schedule: string;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  // =========================
// 🔥 DISTRIBUTION METADATA (NEW)
// =========================
@Column({ nullable: true, default: 'original' })
version: string;

@Column({ default: false })
explicit: boolean;

@Column({ nullable: true })
language: string;

  // 🔥 AUDIO ANALYSIS (PRO)
@Column({ type: 'int', nullable: true })
bpm: number | null;

@Column({ type: 'float', nullable: true })
energy: number | null;

@Column({ type: 'json', nullable: true })
waveform: number[] | null;

  // =========================
  // 📊 ANALYTICS (NEW 🔥)
  // =========================
  @Column({ default: 0 })
  plays: number;

  // =========================
  // 🔗 RELATIONS
  // =========================
  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  user: User | null;

  @ManyToOne(() => Release, (release) => release.id, {
    nullable: true,
  })
  release: Release | null;

  // =========================
  // 📅 CREATED
  // =========================
  @CreateDateColumn()
  createdAt: Date;
}