import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Unsubscribe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;
}