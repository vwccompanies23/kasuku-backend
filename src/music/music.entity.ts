import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Release } from '../releases/release.entity';
import { Artist } from '../artists/artist.entity';

@Entity()
export class Music {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
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

@Column({
  default: 'draft',
})
status: string;

// =========================
// ✅ APPROVAL SYSTEM
// =========================
@Column({
  type: 'enum',
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending',
})
approvalStatus: string;

@Column({
  type: 'text',
  nullable: true,
})
rejectionReason: string | null;

@Column({
  type: 'timestamp',
  nullable: true,
})
approvedAt: Date | null;

@Column({
  type: 'timestamp',
  nullable: true,
})
rejectedAt: Date | null;

@Column({
  type: 'text',
  nullable: true,
})
adminNotes: string | null;

@Column('simple-array', { nullable: true })
issues: string[];

// =========================
// 🎼 GENRES
// =========================
@Column({ nullable: true })
primaryGenre: string;

@Column({ nullable: true })
secondaryGenre: string;

// =========================
// 🎤 FEATURED ARTISTS
// =========================
@Column({ type: 'json', nullable: true })
featuredArtists: {
  name: string;
  role: 'featured' | 'primary';
  spotifyId?: string;
  appleMusicId?: string;
}[];

// =========================
// 🎤 ARTISTS (REAL SYSTEM)
// =========================
@ManyToMany(() => Artist, (artist) => artist.music, {
  cascade: true,
})
@JoinTable()
artists: Artist[];

// =========================
// ✍️ SONGWRITERS (ROYALTIES)
// =========================
@Column({ type: 'json', nullable: true })
songwriters: {
  name: string;
  role: 'lyrics' | 'composition' | 'both';
}[];

// =========================
// 🏷️ LABEL
// =========================
@Column({ nullable: true })
labelName: string;

// =========================
// ⚖️ LEGAL
// =========================
@Column({ default: false })
termsAccepted: boolean;

@Column({ default: false })
rightsConfirmed: boolean;

@Column({ default: false })
noFraudConfirmed: boolean;

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
@Column({
  type: 'enum',
  enum: ['original', 'radio_edit', 'remix', 'acoustic', 'instrumental'],
  default: 'original',
})
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