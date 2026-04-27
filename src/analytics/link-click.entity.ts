import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { Release } from '../releases/release.entity';

@Entity()
export class LinkClick {
  @PrimaryGeneratedColumn()
  id: number;

  // 🎧 PLATFORM (spotify, apple, youtube)
  @Column()
  platform: string;

  // 🔗 RELEASE
  @ManyToOne(() => Release, (release) => release.id, {
    onDelete: 'CASCADE',
  })
  release: Release;

  // 📅 TIME
  @CreateDateColumn()
  createdAt: Date;
}