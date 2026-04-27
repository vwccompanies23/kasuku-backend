import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Music } from '../music/music.entity';

// ⚠️ IMPORTANT: keep this import
import { ReleaseArtist } from './release-artist.entity';

// 🔥 KEEP (even if not used yet — future use)
import { Artist } from '../artists/artist.entity';

export enum ReleaseType {
  SINGLE = 'single',
  ALBUM = 'album',
}

@Entity()
export class Release {
  @PrimaryGeneratedColumn()
  id: number;

  // =========================
  // 🎵 RELEASE INFO
  // =========================
  @Column()
  title: string;

  @Column()
  artistName: string; // ✅ KEEP (legacy)

  // 🔥 NEW (SHAREABLE LINK)
  @Column({ unique: true, nullable: true })
  slug: string;

  // =========================
  // 🔥 PLATFORM IDS
  // =========================
  @Column({ nullable: true })
  spotifyArtistId: string;

  @Column({ nullable: true })
  appleMusicId: string;

  @Column({ nullable: true })
  youtubeChannelId: string;

  @Column({ type: 'json', nullable: true })
  platformResults: any;

  // =========================
  // 📦 DISTRIBUTION
  // =========================
  @Column({ default: 'draft' })
status:
  | 'draft'
  | 'processing'
  | 'submitted'
  | 'approved'
  | 'delivered'
  | 'live'
  | 'failed'
  | 'ready';

  // =========================
// 🕒 LIFECYCLE TRACKING (NEW)
// =========================
@Column({ type: 'timestamp', nullable: true })
submittedAt: Date;

@Column({ type: 'timestamp', nullable: true })
processingAt: Date;

@Column({ type: 'timestamp', nullable: true })
deliveredAt: Date;

@Column({ type: 'timestamp', nullable: true })
liveAt: Date;

@Column({ type: 'timestamp', nullable: true })
failedAt: Date;

    // 🔥 NEW (MULTI DISTRIBUTOR)
@Column({ default: 'internal' })
distributor: string;

  @Column({ nullable: true })
  distributionId: string;

  @Column({ nullable: true })
  upc: string;

  @Column({ default: false })
  isDistributed: boolean;

  // =========================
  // 📅 DATES
  // =========================
  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  originalReleaseDate: Date;

  // =========================
  // 🎼 TYPE
  // =========================
  @Column({
    type: 'enum',
    enum: ReleaseType,
  })
  type: ReleaseType;

  // =========================
  // 🔥 METADATA
  // =========================
  @Column({ nullable: true })
  genre: string;

  @Column({ nullable: true })
  subgenre: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true, default: 'Kasuku.com' })
  labelName: string;

  // =========================
  // 🎵 FILES
  // =========================
  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  audioFile: string;

  @Column({ nullable: true })
  distributionInfo: string;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  originalDate: string;

  @Column({ default: 'pending' })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  // =========================
  // 🎵 MUSIC RELATION
  // =========================
  @OneToMany(() => Music, (music) => music.release)
  music: Music[];

  // =========================
  // 👤 OWNER
  // =========================
  @ManyToOne(() => User, (user) => user.releases, {
    onDelete: 'CASCADE',
  })
  user: User;

  // =========================
  // 🎤 NEW ARTIST SYSTEM (FIXED)
  // =========================
  @OneToMany(
    () => ReleaseArtist,
    (releaseArtist) => releaseArtist.release,
    {
      cascade: true,
    },
  )
  releaseArtists: ReleaseArtist[];
}