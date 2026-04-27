import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { Release } from './release.entity';
import { Artist } from '../artists/artist.entity';

// 🔥 SAME ENUM (duplicate safe)
export enum ArtistRole {
  PRIMARY = 'primary',
  FEATURED = 'featured',
}

@Entity()
export class ReleaseArtist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Release, (release) => release.releaseArtists, {
    onDelete: 'CASCADE',
  })
  release: Release;

  @ManyToOne(() => Artist, {
    eager: true,
    onDelete: 'CASCADE',
  })
  artist: Artist;

  @Column({
    type: 'enum',
    enum: ArtistRole,
  })
  role: ArtistRole;
}