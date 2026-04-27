import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Artist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 🔥 DSP IDs
  @Column({ nullable: true })
  spotifyId?: string;

  @Column({ nullable: true })
  appleMusicId?: string;

  @Column({ nullable: true })
  youtubeChannelId?: string;

  // 🔥 ownership
  @Column({ nullable: true })
  userId?: number;

  // ✅ FIX: match service naming
  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isNew: boolean;
}