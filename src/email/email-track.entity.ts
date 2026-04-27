import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class EmailTrack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ default: 0 })
  opens: number;

  @Column({ default: 0 })
  clicks: number;

  @CreateDateColumn()
  createdAt: Date;
}