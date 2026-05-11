import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity()
export class Pricing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  plan: string;

  @Column({
    type: 'float',
    default: 1.75,
  })
  monthlyPrice: number;

  @Column({
    type: 'float',
    default: 20.99,
  })
  yearlyPrice: number;

  @Column({
    default: 1,
  })
  artistCount: number;

  @Column({
    default: true,
  })
  active: boolean;
}