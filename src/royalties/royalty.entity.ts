import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Music } from '../music/music.entity'; // 🔥 NEW

@Entity()
export class Royalty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  source: string;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  user: User;

  // =========================
  // 🔥 NEW (LINK TO TRACK)
  // =========================
  @ManyToOne(() => Music, (music) => music.id, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  music: Music;
}