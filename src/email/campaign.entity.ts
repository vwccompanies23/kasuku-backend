import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column({ default: 0 })
  sent: number;

  @Column({ default: 0 })
  opened: number;

  @Column({ default: 0 })
  clicked: number;

  @Column()
  createdAt: Date;
}