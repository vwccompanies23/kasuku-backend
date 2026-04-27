import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Music } from '../music/music.entity';

@Entity()
export class Earning {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  amount: number;

  @Column()
  month: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  track: string;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  user: User;

  // ✅ FIXED HERE
  @ManyToOne(() => Music, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  music?: Music | null;
}