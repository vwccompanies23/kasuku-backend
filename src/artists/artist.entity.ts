import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Music } from '../music/music.entity';

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

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isNew: boolean;

  // ✅ 🔥 ADD THIS PART (THIS FIXES YOUR ERROR)
  @ManyToMany(() => Music, (music) => music.artists)
  music: Music[];
}